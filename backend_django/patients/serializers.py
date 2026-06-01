from rest_framework import serializers
from .models import Patient, MedicalRecord, LabTest, AuditLog

class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class MedicalRecordSerializer(serializers.ModelSerializer):
    test_name = serializers.ReadOnlyField(source='test.name')
    test_unit = serializers.ReadOnlyField(source='test.unit')
    test_range = serializers.SerializerMethodField()
    patient_name = serializers.ReadOnlyField(source='patient.__str__')
    performed_by_name = serializers.ReadOnlyField(source='performed_by.username')

    class Meta:
        model = MedicalRecord
        fields = '__all__'

    def get_test_range(self, obj):
        if obj.test:
            return f"{obj.test.min_range} - {obj.test.max_range}"
        return "N/A"

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = '__all__'
