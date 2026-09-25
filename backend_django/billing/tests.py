from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import InventoryItem, Invoice, Payment
from patients.models import Patient, MedicalRecord, LabTest

User = get_user_model()

class BillingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='password123',
            role='ADMIN'
        )
        self.receptionist_user = User.objects.create_user(
            username='receptionist_test',
            password='password123',
            role='RECEPTIONIST'
        )
        self.item = InventoryItem.objects.create(
            name='Test Reagent',
            quantity=50.0,
            unit='ml',
            min_stock_level=10.0,
            unit_price=5.00
        )
        self.patient = Patient.objects.create(
            first_name='John',
            last_name='Doe',
            date_of_birth='1990-01-01',
            gender='Male',
            phone_number='1234567890',
            email='john@example.com',
            address='123 Main St'
        )
        self.lab_test = LabTest.objects.create(
            name='Blood Sugar',
            category='Hematology',
            unit='mg/dL',
            min_range=70.0,
            max_range=100.0,
            price=25.00
        )

    def test_inventory_list(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/billing/inventory/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'Healthy')

    def test_create_invoice_from_records(self):
        self.client.force_authenticate(user=self.receptionist_user)
        record = MedicalRecord.objects.create(
            patient=self.patient,
            test=self.lab_test,
            result_value=85.0,
            status='Completed'
        )
        response = self.client.post('/api/billing/invoices/create_from_records/', {
            'patient_id': str(self.patient.id),
            'record_ids': [record.id]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['total_amount']), 25.00)

    def test_analytics_view(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/billing/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_revenue', response.data)
        self.assertIn('abnormal_rate', response.data)
