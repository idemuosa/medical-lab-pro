from django.db import models
from django.conf import settings
import uuid

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=[
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other')
    ])
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    address = models.TextField()

    # Audit Fields (Critical for Hospital Grade EHR)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class LabTest(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    min_range = models.FloatField()
    max_range = models.FloatField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    # Link to inventory for automatic stock reduction
    required_reagent = models.ForeignKey('billing.InventoryItem', on_delete=models.SET_NULL, null=True, blank=True)
    reagent_usage_per_test = models.FloatField(default=1.0)

    def __str__(self):
        return f"{self.name} ({self.unit})"

class MedicalRecord(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    test = models.ForeignKey(LabTest, on_delete=models.SET_NULL, null=True)
    result_value = models.FloatField(null=True, blank=True)
    is_abnormal = models.BooleanField(default=False)
    doctor_notes = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')

    # New fields for Workflow & Audit
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_tests'
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='validated_tests'
    )
    validation_notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='lab_attachments/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Abnormal flagging logic
        if self.result_value is not None and self.test:
            if self.result_value < self.test.min_range or self.result_value > self.test.max_range:
                self.is_abnormal = True
            else:
                self.is_abnormal = False

            # Inventory Subtraction Logic (Module C)
            # We only subtract once when the test is marked as 'Completed'
            if self.status == 'Completed' and self.test.required_reagent:
                reagent = self.test.required_reagent
                reagent.quantity -= self.test.reagent_usage_per_test
                reagent.save()

        super().save(*args, **kwargs)

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"
