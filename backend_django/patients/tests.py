from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Patient, LabTest, MedicalRecord, AuditLog
from billing.models import InventoryItem

User = get_user_model()

class PatientsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', password='password', role='ADMIN')
        self.lab_tech = User.objects.create_user(username='labtech', password='password', role='LAB_TECH')
        self.reagent = InventoryItem.objects.create(name='Glucose Reagent', quantity=20.0, min_stock_level=5.0)
        self.test = LabTest.objects.create(
            name='Glucose Test',
            category='Biochemistry',
            unit='mg/dL',
            min_range=70.0,
            max_range=110.0,
            price=15.00,
            required_reagent=self.reagent,
            reagent_usage_per_test=2.0
        )
        self.patient = Patient.objects.create(
            first_name='Jane',
            last_name='Smith',
            date_of_birth='1995-05-15',
            gender='Female',
            phone_number='0987654321',
            email='jane@example.com',
            address='456 Elm St'
        )

    def test_create_patient(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "first_name": "Alice",
            "last_name": "Brown",
            "date_of_birth": "1992-02-02",
            "gender": "Female",
            "phone_number": "5551234567",
            "email": "alice@example.com",
            "address": "789 Oak Rd"
        }
        response = self.client.post('/api/patients/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_medical_record_and_reagent_deduction(self):
        self.client.force_authenticate(user=self.lab_tech)
        data = {
            "patient": str(self.patient.id),
            "test": self.test.id,
            "result_value": 125.0, # Abnormal value (>110)
            "status": "Completed"
        }
        response = self.client.post('/api/records/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_abnormal'])

        # Check stock deduction
        self.reagent.refresh_from_db()
        self.assertEqual(self.reagent.quantity, 18.0)

    def test_download_pdf_report(self):
        self.client.force_authenticate(user=self.admin)
        record = MedicalRecord.objects.create(
            patient=self.patient,
            test=self.test,
            result_value=85.0,
            status="Completed"
        )
        response = self.client.get(f'/api/records/{record.id}/download_pdf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
