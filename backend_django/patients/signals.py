from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Patient, MedicalRecord

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
