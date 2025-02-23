"""
This file contains test cases for user management functionalities 
The tests cover:
- Managing users: Admins can retrieve the list of all users while non-admins are restricted.
- Adding users: Tests for successful user creation, handling duplicate emails, missing fields, and unauthenticated requests.
- Editing users: Tests for retrieving and updating user details, including invalid data and non-existent users.
- Deleting users: Tests for successful deletion, handling of non-existent users, and unauthenticated attempts.

"""

from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from auth_app.models import users
from .serializers import StaffSerializer

User = get_user_model()

class ManageUsersViewTest(TestCase):
    # setUp(): Set up objects to be used in the tests
    def setUp(self):
        self.admin_user = users.objects.create_user(
            first_name='Test',
            last_name='Admin',
            username="admin",
            password="adminpassword",
            email="admin@example.com",
            date_of_hire='1990-01-01',
            department='Testing',
            role='admin',
            is_staff=False
        )

        self.staff_user = users.objects.create_user(
            first_name='Test',
            last_name='Employee',
            username="employee",
            password="employeepassword",
            email="employee@example.com",
            date_of_hire='2025-12-29',
            department='Testing',
            role='user',
            is_staff=True
        )

        self.manage_users_url = reverse('manage_users')

        self.client = APIClient()

    # test_manage_users_authenticated_request(): Expected behaviour when an admin accesses the page
    def test_manage_users_authenticated_request(self):
        # Arrange
        staff_data = users.objects.all()
        serializer = StaffSerializer(staff_data, many=True)
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        # Act
        response = self.client.get(self.manage_users_url)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK) # check if authorized to be on this page
        self.assertEqual(response.data, serializer.data) # check if page retrieves all entries from the database
    
    # test_manage_users_non_admin_user_request(): Handling of a non-authorized role (not an admin)
    def test_manage_users_non_admin_user_request(self):
        # Arrange
        refresh = RefreshToken.for_user(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        # Act
        response = self.client.get(self.manage_users_url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # check if user was not authorized
        self.assertEqual(response.data, {'detail': 'You do not have permission to perform this action.'}) # checking that only data retrieved was the error message

class AddUserTests(APITestCase):
    def setUp(self):
        # Create a user who will perform the add operations
        self.admin_user = users.objects.create_user(
            username='adminuser',
            email='adminuser@example.com',
            password='adminpassword',
            role='admin',
            date_of_hire='1980-08-08',
            first_name='Admin',
            last_name='User',
            department='Administration',
        )
        # Log in to get an access token
        self.login_url = reverse('login')
        login_data = {
            'username': 'adminuser',
            'password': 'adminpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Login failed in setUp.")
        self.access_token = response.data.get('access')

        # Set up the URL for adding users
        self.add_user_url = reverse('add_user')

    def test_add_user_success(self):
        """
        Ensure that an authenticated user can add a new user successfully.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        user_data = {
            'username': 'newuser',
            'password': 'newpassword123',
            'email': 'newuser@example.com',
            'role': 'user',
            'first_name': 'New',
            'last_name': 'User',
            'department': 'Testing',
            'date_of_hire': '1995-05-15'
        }
        response = self.client.post(self.add_user_url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User created successfully')

        # Verify that the user was added to the database
        user = users.objects.get(email='newuser@example.com')
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.role, 'user')

    def test_add_user_duplicate_email(self):
        """
        Ensure that adding a user with an existing email fails.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        user_data = {
            'username': 'anotheruser',
            'password': 'anotherpassword123',
            'email': 'adminuser@example.com',  # Duplicate email
            'role': 'user',
            'first_name': 'Another',
            'last_name': 'User',
            'department': 'Testing',
            'date_of_hire': '1990-05-15'
        }
        response = self.client.post(self.add_user_url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'User with this email already exists')

    def test_add_user_missing_fields(self):
        """
        Ensure that missing required fields result in a 400 error.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        incomplete_data = {
            'username': 'incompleteuser',
            # Missing password, email, and other required fields
        }
        response = self.client.post(self.add_user_url, incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    def test_add_user_unauthenticated(self):
        """
        Ensure that an unauthenticated user cannot add a new user.
        """
        user_data = {
            'username': 'unauthuser',
            'password': 'unauthpassword123',
            'email': 'unauthuser@example.com',
            'role': 'user',
            'first_name': 'Unauth',
            'last_name': 'User',
            'department': 'Testing',
            'date_of_hire': '2000-01-01'
        }
        response = self.client.post(self.add_user_url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)




class EditUserTests(APITestCase):
    def setUp(self):
        # Create a user who will perform the edit operations
        self.editor_user = users.objects.create_user(
            username='editoruser',
            email='editoruser@example.com',
            password='editorpassword',
            role='admin',
            date_of_hire='1985-05-15',
            first_name='Editor',
            last_name='User',
            department='Editing',
        )
        # Create a user who will be the target of edit operations
        self.target_user = users.objects.create_user(
            username='targetuser',
            email='targetuser@example.com',
            password='targetpassword',
            role='staff',
            date_of_hire='1990-01-01',
            first_name='Target',
            last_name='User',
            department='Targeting',
        )
        # Log in to get an access token
        self.login_url = reverse('login')
        login_data = {
            'username': 'editoruser',
            'password': 'editorpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Login failed in setUp.")
        self.access_token = response.data.get('access')

        # Set up the URLs for editing
        self.edit_user_url = reverse('edit_user', kwargs={'user_id': self.target_user.user_id})

    def test_get_user_success(self):
        """
        Ensure that an authenticated user can retrieve details of another user.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(self.edit_user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'targetuser')
        self.assertEqual(response.data['email'], 'targetuser@example.com')
        self.assertEqual(response.data['role'], 'staff')
        self.assertEqual(response.data['first_name'], 'Target')
        self.assertEqual(response.data['last_name'], 'User')
        self.assertEqual(response.data['department'], 'Targeting')

    def test_get_user_not_found(self):
        """
        Ensure that requesting a non-existent user returns a 404 error.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        url = reverse('edit_user', kwargs={'user_id': 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found')

    def test_get_user_unauthenticated(self):
        """
        Ensure that an unauthenticated user cannot retrieve user details.
        """
        response = self.client.get(self.edit_user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_success(self):
        """
        Ensure that an authenticated user can update another user's details.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        update_data = {
            'first_name': 'UpdatedFirstName',
            'last_name': 'UpdatedLastName',
            'department': 'UpdatedDepartment',
        }
        response = self.client.put(self.edit_user_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User updated successfully')

        # Verify that the user's details have been updated
        self.target_user.refresh_from_db()
        self.assertEqual(self.target_user.first_name, 'UpdatedFirstName')
        self.assertEqual(self.target_user.last_name, 'UpdatedLastName')
        self.assertEqual(self.target_user.department, 'UpdatedDepartment')

    def test_update_user_invalid_data(self):
        """
        Ensure that providing invalid data results in a 400 error.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        invalid_data = {
            'email': 'not-an-email'  # Invalid email format
        }
        response = self.client.put(self.edit_user_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_update_user_not_found(self):
        """
        Ensure that updating a non-existent user returns a 404 error.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        url = reverse('edit_user', kwargs={'user_id': 9999})
        update_data = {
            'first_name': 'ShouldNotWork'
        }
        response = self.client.put(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found')

    def test_update_user_unauthenticated(self):
        """
        Ensure that an unauthenticated user cannot update user details.
        """
        update_data = {
            'first_name': 'ShouldNotWork'
        }
        response = self.client.put(self.edit_user_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeleteUserTests(APITestCase):
    def setUp(self):
        # Create a user who will perform the delete operations
        self.deleter_user = users.objects.create_user(
            username='deleteruser',
            email='deleteruser@example.com',
            password='deleterpassword',
            role='deleter',
            date_of_hire='1980-08-08',
            first_name='Deleter',
            last_name='User',
            department='Deleting',
        )
        # Create a user who will be the target of delete operations
        self.target_user = users.objects.create_user(
            username='targetuser',
            email='targetuser@example.com',
            password='targetpassword',
            role='user',
            date_of_hire='1990-01-01',
            first_name='Target',
            last_name='User',
            department='Targeting',
        )
        # Log in to get an access token
        self.login_url = reverse('login')
        login_data = {
            'username': 'deleteruser',
            'password': 'deleterpassword'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Login failed in setUp.")
        self.access_token = response.data.get('access')

        # Set up the URLs for deleting
        self.delete_user_url = reverse('delete_user', kwargs={'user_id': self.target_user.user_id})

    def test_delete_user_success(self):
        """
        Ensure that an authenticated user can delete another user.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.delete(self.delete_user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User deleted successfully')

        # Verify that the user has been deleted
        with self.assertRaises(users.DoesNotExist):
            users.objects.get(user_id=self.target_user.user_id)

    def test_delete_user_not_found(self):
        """
        Ensure that deleting a non-existent user returns a 404 error.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        url = reverse('delete_user', kwargs={'user_id': 9999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found')

    def test_delete_user_unauthenticated(self):
        """
        Ensure that an unauthenticated user cannot delete a user.
        """
        response = self.client.delete(self.delete_user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)