from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_patient_result_notification(patient_name, patient_email, test_name, result_link):
    """
    Sends an email notification to the patient when their lab results are ready.
    """
    subject = f"Lab Results Ready: {test_name}"
    message = f"Hello {patient_name},\n\nYour laboratory results for '{test_name}' are now available. You can view them by logging into your portal or clicking the link below:\n\n{result_link}\n\nStay healthy,\nMedical Lab Pro Team"

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@medlabpro.com',
            [patient_email],
            fail_silently=False,
        )
        logger.info(f"Email sent to {patient_email} for {test_name}")
    except Exception as e:
        logger.error(f"Failed to send email to {patient_email}: {e}")

@shared_task
def send_sms_notification(patient_phone, message):
    """
    Sends an SMS notification to the patient.
    Placeholder for actual SMS integration (e.g., Twilio).
    """
    if settings.SMS_PROVIDER == 'CONSOLE':
        print(f"--- SMS SENT TO {patient_phone} ---")
        print(f"Message: {message}")
        print("--------------------------------")
    else:
        # Integration logic for Twilio or other providers would go here
        logger.info(f"SMS would be sent to {patient_phone} via {settings.SMS_PROVIDER}")
