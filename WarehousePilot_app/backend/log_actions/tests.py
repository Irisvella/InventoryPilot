# This file tests the InventoryPickingLogging view in the Django application

from django.test import TestCase
from unittest.mock import patch
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from auth_app.models import users


class InventoryPickingLoggingTests(TestCase):
    # setUp(): used to set up values shared between tests.
    def setUp(self):
        # Create a test user with test values
        self.user = users.objects.create_user(
            first_name='Test',
            last_name='Admin',
            username="admin",
            password="adminpassword",
            email="admin@example.com",
            date_of_hire='1990-01-01',
            department='Testing',
            role='admin',
            is_staff=False,
            theme_preference='light'
        )

        # Create an API client instance
        self.client = APIClient()

        # Authenticate the user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        # Backend URL for the InventoryPickingLogging endpoint
        self.url = reverse('inventory_picking_logging') 

    @patch('inventory.models.InventoryPicklist.objects.all')
    @patch('inventory.models.InventoryPicklistItem.objects.all')
    @patch('inventory.models.Inventory.objects.all')
    # test_get_inventory_picking_logging_success(): Test the successful retrieval of inventory picking logs
    def test_get_inventory_picking_logging_success(self, mock_inventory, mock_picklist_item, mock_picklist):
        # Arrange: Mocking InventoryPicklist, InventoryPicklistItem, and Inventory models
        mock_picklist.return_value.values.return_value.filter.return_value.order_by.return_value = [
            {'picklist_id': 1, 'warehouse_nb': '499', 'assigned_employee_id': 123}
        ]
        mock_picklist_item.return_value.filter.return_value.values.return_value = [
            {'picklist_id': 1, 'picked_at': timezone.now(), 'location': 'A1', 'sku_color': 'red', 'amount': 10}
        ]
        mock_inventory.return_value.filter.return_value.values.return_value.first.return_value = {'location': 'A1', 'sku_color': 'red'}

        # Act: Make a GET request to InventoryPickingLogging
        response = self.client.get(self.url)

        # Assert: Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['warehouse'], '499')
        self.assertEqual(response.data[0]['employee_id'], 123)
        self.assertEqual(response.data[0]['sku_color'], 'red')
        self.assertEqual(response.data[0]['location'], 'A1')
        self.assertEqual(response.data[0]['qty_out'], 10)

    @patch('inventory.models.InventoryPicklist.objects.all')
    # test_get_inventory_picking_logging_no_picklists(): Test the case when there are no picklists available
    def test_get_inventory_picking_logging_no_picklists(self, mock_picklist):
        # Arrange: Mocking InventoryPicklist to return an empty list
        mock_picklist.return_value.values.return_value.filter.return_value.order_by.return_value = []

        # Act: Make a GET request to InventoryPickingLogging
        response = self.client.get(self.url)

        # Assert: Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    @patch('inventory.models.InventoryPicklist.objects.all')
    # test_get_inventory_picking_logging_exception(): Test the case when an exception occurs while fetching picklists
    def test_get_inventory_picking_logging_exception(self, mock_picklist):
        # Arrange: Mocking InventoryPicklist to raise an exception
        mock_picklist.side_effect = Exception("Failed to fetch the data for tracking inventory picking activity (InventoryPickingLogging)")

        # Act: Make a GET request to InventoryPickingLogging
        response = self.client.get(self.url)

        # Assert: Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    @patch('inventory.models.InventoryPicklist.objects.all')
    @patch('inventory.models.InventoryPicklistItem.objects.all')
    @patch('inventory.models.Inventory.objects.all')
    # test_get_inventory_picking_logging_missing_data(): Test the case where warehouse_nb or location is missing
    def test_get_inventory_picking_logging_missing_data(self, mock_inventory, mock_picklist_item, mock_picklist):
        # Arrange: Mocking InventoryPicklist with missing warehouse_nb, InventoryPicklistItem with missing location, and Inventory models
        mock_picklist.return_value.values.return_value.filter.return_value.order_by.return_value = [
            {'picklist_id': 1, 'warehouse_nb': None, 'assigned_employee_id': 123}
        ]
        mock_picklist_item.return_value.filter.return_value.values.return_value = [
            {'picklist_id': 1, 'picked_at': timezone.now(), 'location': None, 'sku_color': 'red', 'amount': 10}
        ]
        mock_inventory.return_value.filter.return_value.values.return_value.first.return_value = {'location': 'A1', 'sku_color_id': 'red'}

        # Act: Make a GET request to InventoryPickingLogging
        response = self.client.get(self.url)

        # Assert: Check the response status and data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['warehouse'], '499')
        self.assertEqual(response.data[0]['employee_id'], 123)
        self.assertEqual(response.data[0]['sku_color'], 'red')
        self.assertEqual(response.data[0]['location'], 'A1')
        self.assertEqual(response.data[0]['qty_out'], 10)