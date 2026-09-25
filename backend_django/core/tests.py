from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class CoreAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='password123',
            email='test@example.com',
            role='RECEPTIONIST'
        )

    def test_user_me_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['role'], 'RECEPTIONIST')

    def test_register_user(self):
        data = {
            "username": "newuser",
            "password": "newpassword123",
            "email": "newuser@example.com",
            "role": "DOCTOR",
            "first_name": "Doc",
            "last_name": "Who"
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(username="newuser")
        self.assertTrue(created_user.check_password("newpassword123"))
