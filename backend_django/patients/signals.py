from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Patient, MedicalRecord
from billing.models import InventoryItem
from .tasks import send_patient_result_notification

@receiver(post_save, sender=Patient)
def patient_saved(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "global_notifications",
            {
                "type": "send_notification",
                "content": {
                    "message": f"New patient registered: {instance.first_name} {instance.last_name}",
                    "type": "NEW_PATIENT"
                }
            }
        )

@receiver(post_save, sender=MedicalRecord)
def medical_record_saved(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "global_notifications",
            {
                "type": "send_notification",
                "content": {
                    "message": f"New lab result recorded for {instance.patient}",
                    "type": "NEW_RESULT"
                }
            }
        )

    # Automated Email Trigger when results are finalized
    if instance.status == 'Completed' and instance.patient.email:
        send_patient_result_notification.delay(
            f"{instance.patient.first_name} {instance.patient.last_name}",
            instance.patient.email,
            instance.test.name if instance.test else "Lab Test",
            f"http://localhost:3000/dashboard/results/" # Link to portal
        )

@receiver(post_save, sender=InventoryItem)
def inventory_stock_alert(sender, instance, **kwargs):
    if instance.quantity <= instance.min_stock_level:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "global_notifications",
            {
                "type": "send_notification",
                "content": {
                    "message": f"LOW STOCK ALERT: {instance.name} is at {instance.quantity} {instance.unit}",
                    "type": "INVENTORY_ALERT"
                }
            }
        )
