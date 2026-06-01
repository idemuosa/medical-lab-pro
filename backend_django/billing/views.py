from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import Invoice, Payment, InventoryItem
from patients.models import MedicalRecord, Patient
from .serializers import InvoiceSerializer, PaymentSerializer, InventoryItemSerializer
from core.permissions import IsAdminUser, IsReceptionist
from django.db import transaction

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminUser | IsReceptionist]

    @action(detail=False, methods=['post'])
    def create_from_records(self, request):
        patient_id = request.data.get('patient_id')
        record_ids = request.data.get('record_ids', [])

        if not patient_id:
            return Response({"error": "patient_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = Patient.objects.get(id=patient_id)
            records = MedicalRecord.objects.filter(id__in=record_ids, patient=patient, status='Completed')

            if not records.exists():
                return Response({"error": "No completed records found to bill"}, status=status.HTTP_400_BAD_REQUEST)

            total_amount = sum(r.test.price for r in records if r.test)

            with transaction.atomic():
                invoice = Invoice.objects.create(
                    patient=patient,
                    total_amount=total_amount
                )
                invoice.records.set(records)

            return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser | IsReceptionist]

class AnalyticsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        last_30_days = timezone.now() - timedelta(days=30)

        # Revenue stats
        total_revenue = Invoice.objects.filter(is_paid=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # Test stats
        test_counts = MedicalRecord.objects.filter(created_at__gte=last_30_days).values('test__name').annotate(count=Count('id')).order_by('-count')

        # Abnormal stats
        abnormal_count = MedicalRecord.objects.filter(is_abnormal=True).count()
        total_tests = MedicalRecord.objects.count()

        return Response({
            "total_revenue": float(total_revenue),
            "abnormal_rate": round((abnormal_count / total_tests * 100) if total_tests > 0 else 0, 2),
            "popular_tests": list(test_counts[:5]),
            "low_stock_alerts": InventoryItem.objects.filter(quantity__lte=F('min_stock_level')).count()
        })
