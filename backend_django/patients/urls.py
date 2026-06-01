from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, MedicalRecordViewSet, LabTestViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'records', MedicalRecordViewSet)
router.register(r'tests', LabTestViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
