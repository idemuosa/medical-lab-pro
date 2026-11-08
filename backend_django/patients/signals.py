import os
import logging
import httpx
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Patient, MedicalRecord
from billing.models import InventoryItem
from .tasks import send_patient_result_notification

logger = logging.getLogger(__name__)

def notify_socket_server(event_type, message, data=None):
    socket_server_url = os.environ.get('SOCKET_SERVER_URL', 'http://localhost:4000')
    try:
        with httpx.Client(timeout=2.0) as client:
            client.post(
                f"{socket_server_url}/trigger",
                json={
                    "message": message,
                    "type": event_type,
                    "data": data or {}
                }
            )
    except Exception as exc:
        logger.warning(f"Could not reach socket server at {socket_server_url}: {exc}")

@receiver(post_save, sender=Patient)
def patient_saved(sender, instance, created, **kwargs):
    if created:
        message = f"New patient registered: {instance.first_name} {instance.last_name}"
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "global_notifications",
                {
                    "type": "send_notification",
                    "content": {
                        "message": message,
                        "type": "NEW_PATIENT"
                    }
                }
            )
        notify_socket_server("NEW_PATIENT", message, {"patient_id": str(instance.id)})

@receiver(post_save, sender=MedicalRecord)
def medical_record_saved(sender, instance, created, **kwargs):
    if created:
        message = f"New lab result recorded for {instance.patient}"
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "global_notifications",
                {
                    "type": "send_notification",
                    "content": {
                        "message": message,
                        "type": "NEW_RESULT"
                    }
                }
            )
        notify_socket_server("NEW_RESULT", message, {"record_id": instance.id})

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
        message = f"LOW STOCK ALERT: {instance.name} is at {instance.quantity} {instance.unit}"
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "global_notifications",
                {
                    "type": "send_notification",
                    "content": {
                        "message": message,
                        "type": "INVENTORY_ALERT"
                    }
                }
            )
        notify_socket_server("INVENTORY_ALERT", message, {"item_id": instance.id})
