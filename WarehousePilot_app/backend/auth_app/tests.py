"""
This file contains test cases for validating authentication
 It includes the following test classes:
1. `AuthTests`: Tests login functionality, including successful login and failure scenarios with invalid credentials.
2. `ChangePasswordTests`: Verifies the password change process, handling scenarios like correct, incorrect, or missing old passwords.
3. `ProfileViewTests`: Tests profile retrieval, including access for authenticated users, unauthenticated access, and handling invalid tokens.

"""


from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from .models import users

User = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.user = users.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword',
            role='user',
            date_of_hire='1990-01-01',
            first_name='Test',
            last_name='User',
            department='Testing',
        )   
        self.login_url = reverse('login')

    def test_login_success(self):
        data = {
            'username': 'testuser',
            'password': 'testpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = users.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='oldpassword',
            role='user',
            date_of_hire='1990-01-01',
            first_name='Test',
            last_name='User',
            department='Testing',
        )   
        self.url = reverse('change_password')  
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        """
        Checks if the password is changed successfully and the user can login with the new password.
        """
        data = {
            'old_password': 'oldpassword',
            'new_password': 'newpassword123'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Password changed successfully')
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_change_password_incorrect_old_password(self):
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Old password is incorrect')

    def test_change_password_missing_old_password(self):
        data = {
            'new_password': 'newpassword123'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class ProfileViewTests(APITestCase):
    def setUp(self):
        self.user = users.objects.create_user(
            username='profileuser',
            email='profileuser@example.com',
            password='profilepass',
            role='user',
            date_of_hire='1990-01-01',
            first_name='Profile',
            last_name='Tester',
            department='QA',
        )
        # Login to get an access token
        self.login_url = reverse('login') 
        login_data = {
            'username': 'profileuser',
            'password': 'profilepass'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Login failed in setUp.")
        
        # Store tokens and set up the headers for authenticated requests
        self.access_token = response.data.get('access')
        self.profile_url = reverse('profile') # URL here 

    def test_profile_success(self):
        """
        Ensure that an authenticated user can retrieve their own profile data.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.data)
        self.assertIn('email', response.data)
        self.assertIn('role', response.data)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('department', response.data)
        
        self.assertEqual(response.data['username'], 'profileuser')
        self.assertEqual(response.data['email'], 'profileuser@example.com')
        self.assertEqual(response.data['role'], 'user')
        self.assertEqual(response.data['first_name'], 'Profile')
        self.assertEqual(response.data['last_name'], 'Tester')
        self.assertEqual(response.data['department'], 'QA')

    def test_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalidtoken123')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)