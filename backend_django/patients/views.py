from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Patient, MedicalRecord, LabTest, AuditLog
from .serializers import PatientSerializer, MedicalRecordSerializer, LabTestSerializer, AuditLogSerializer
from core.permissions import IsAdminUser, IsDoctor, IsLabTech, IsReceptionist
from .tasks import send_patient_result_notification
from reportlab.pdfgen import canvas
from io import BytesIO

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated]

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsReceptionist | IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['post'])
    def sync_local_data(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "sync successful", "count": len(serializer.data)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsLabTech | IsAdminUser]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action="CREATE",
            resource_type="MedicalRecord",
            resource_id=serializer.instance.id,
            details={"patient": str(serializer.instance.patient)}
        )

    def perform_update(self, serializer):
        old_status = self.get_object().status
        new_status = serializer.validated_data.get('status')

        # If doctor validates the result
        if old_status != 'Validated' and new_status == 'Validated':
            serializer.save(validated_by=self.request.user)
        else:
            serializer.save()

        AuditLog.objects.create(
            user=self.request.user,
            action="UPDATE",
            resource_type="MedicalRecord",
            resource_id=serializer.instance.id,
            details={"status": serializer.instance.status}
        )

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        record = self.get_object()
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        width, height = 595.27, 841.89 # A4

        # Header
        p.setStrokeColorRGB(0.1, 0.2, 0.5)
        p.rect(50, height - 100, width - 100, 60, fill=1, stroke=1)
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 18)
        p.drawCentredString(width / 2, height - 75, "MEDICAL LAB PRO - LABORATORY REPORT")

        # Patient Info Box
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(60, height - 130, "PATIENT INFORMATION")
        p.line(60, height - 135, 200, height - 135)

        p.setFont("Helvetica", 11)
        p.drawString(60, height - 155, f"Name: {record.patient.first_name} {record.patient.last_name}")
        p.drawString(60, height - 175, f"Patient ID: {str(record.patient.id)[:8].upper()}")
        p.drawString(300, height - 155, f"Date of Birth: {record.patient.date_of_birth}")
        p.drawString(300, height - 175, f"Gender: {record.patient.gender}")

        # Test Results Table Header
        p.setFillColorRGB(0.95, 0.95, 0.95)
        p.rect(50, height - 250, width - 100, 25, fill=1, stroke=0)
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 11)
        p.drawString(60, height - 243, "TEST NAME")
        p.drawString(250, height - 243, "RESULT")
        p.drawString(350, height - 243, "REFERENCE RANGE")
        p.drawString(480, height - 243, "STATUS")

        # Result Data
        p.setFont("Helvetica", 11)
        p.drawString(60, height - 275, record.test.name if record.test else "Unknown")
        p.drawString(250, height - 275, f"{record.result_value} {record.test.unit if record.test else ''}")
        p.drawString(350, height - 275, f"{record.test.min_range} - {record.test.max_range}" if record.test else "N/A")

        if record.is_abnormal:
            p.setFillColorRGB(0.8, 0, 0)
            p.drawString(480, height - 275, "ABNORMAL")
        else:
            p.setFillColorRGB(0, 0.5, 0)
            p.drawString(480, height - 275, "NORMAL")

        # Footer
        p.setFillColorRGB(0, 0, 0)
        p.line(50, 100, width - 50, 100)
        p.setFont("Helvetica-Oblique", 9)
        p.drawString(60, 85, f"Report Generated on {record.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        p.drawRightString(width - 60, 85, "Electronic Signature - Medical Lab Pro")

        p.showPage()
        p.save()

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="LabReport_{record.id}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        record = self.get_object()
        if not record.patient.email:
            return Response({"error": "Patient has no email"}, status=status.HTTP_400_BAD_REQUEST)

        send_patient_result_notification.delay(
            f"{record.patient.first_name} {record.patient.last_name}",
            record.patient.email,
            record.test.name if record.test else "Lab Test",
            f"http://localhost:3000/dashboard/results/"
        )
        return Response({"status": "Email queued successfully"})
