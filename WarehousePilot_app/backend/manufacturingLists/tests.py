
"""
This file contains test cases for the Manufacturing List Items API endpoint.
The tests cover:
- Successful retrieval of manufacturing list items associated with a specific order.
- Handling scenarios where the requested order does not exist.
- Handling scenarios where no manufacturing list exists for the requested order.
"""

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Orders, ManufacturingLists, ManufacturingListItem, Part
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken


class ManufacturingListItemsViewTest(APITestCase):

    def setUp(self):
        # a mock user
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="testpassword",
            email="testuser@example.com",
            role="Manager",
            date_of_hire="1990-01-01",
            first_name="Test",
            last_name="User",
            department="Manufacturing"
        )

        #JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # a mock order
        self.order = Orders.objects.create(order_id=1, status="Pending", due_date="2025-01-30", estimated_duration=5)

        #  a mock manufacturing list for the order
        self.manufacturing_list = ManufacturingLists.objects.create(
            order_id=self.order,
            status="In Progress"
        )

        # a mock part
        self.part = Part.objects.create(sku_color="Red")

        # a mock manufacturing list item
        self.manufacturing_list_item = ManufacturingListItem.objects.create(
            manufacturing_list_id=self.manufacturing_list,
            sku_color=self.part,
            amount=10,
            manufacturing_process="cutting",
            process_progress="To Do"
        )

    def test_get_manufacturing_list_items_success(self):
        # Testing successful retrieval of manufacturing list items
        url = reverse('manufacturing_list_item', kwargs={'order_id': self.order.order_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['sku_color'], "Red")
        self.assertEqual(response.data[0]['quantity'], 10)
        self.assertEqual(response.data[0]['manufacturing_process'], "cutting")
        print("test_get_manufacturing_list_items_success passed.")

    def test_get_manufacturing_list_items_order_not_found(self):
        # Testing when the order does not exist
        url = reverse('manufacturing_list_item', kwargs={'order_id': 999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], "Order not found")
        print("test_get_manufacturing_list_items_order_not_found passed.")

    def test_get_manufacturing_list_items_no_manufacturing_list(self):
        # Testing when no manufacturing list exists for the order
        order_without_manufacturing_list = Orders.objects.create(order_id=2, status="Pending", due_date="2025-02-01", estimated_duration=3)
        url = reverse('manufacturing_list_item', kwargs={'order_id': order_without_manufacturing_list.order_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], "No manufacturing list found for the given order")
        print("test_get_manufacturing_list_items_no_manufacturing_list passed.")
