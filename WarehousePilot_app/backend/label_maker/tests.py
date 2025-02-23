from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from inventory.models import InventoryPicklistItem, InventoryPicklist
from orders.models import Orders  
from parts.models import Part
from auth_app.models import users  

User = get_user_model()  

class LabelMakerTests(APITestCase):
    def setUp(self):
        """
        Create a user, get a token, create data for testing.
        """
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass",
            role="admin", 
            email="test@email.com",
            date_of_hire="2000-01-01",
            first_name="Test",
            last_name="User",
            department="Testing"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.order = Orders.objects.create(
            order_id=500,  
            due_date="2025-01-01",
            status="In Progress"
        )

        self.picklist = InventoryPicklist.objects.create(
            order_id=self.order,
            assigned_employee_id=self.user,  
            status=False
        )

        self.part = Part.objects.create(
            sku_color="ABCD123",  
            qty_per_box=10,
            crate_size="LARGE",
            image="some_image.jpg"  
        )

        self.item = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist,
            sku_color=self.part,
            amount=55,
            status=False
        )
        self.url_name = "get_label_data" 
        
    def test_label_data_success(self):
        """
        Ensure a valid picklist_item_id returns the correct data
        """
        url = reverse(self.url_name, args=[self.item.picklist_item_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn("SKU_COLOR", data)
        self.assertIn("QTY", data)
        self.assertIn("ORDER_NUMBER", data)
        self.assertEqual(data["SKU_COLOR"], self.part.sku_color.upper()) 
        self.assertEqual(data["QTY"], self.item.amount)
        self.assertEqual(data["ORDER_NUMBER"], self.order.order_id)  
        self.assertEqual(data["QTY_PER_BOX"], self.part.qty_per_box)
        self.assertEqual(data["CRATE_SIZE"], self.part.crate_size)

    def test_label_data_not_found(self):
        """
        If nonexistent picklist_item_id, expect a 404 + JSON error
        """
        url = reverse(self.url_name, args=[99999])  
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Picklist item not found")

    def test_label_data_unauthenticated(self):
        """
        If not authenticated, should get 401 or 403
        """
        client = APIClient()
        url = reverse(self.url_name, args=[self.item.picklist_item_id])
        response = client.get(url)
        self.assertIn(response.status_code, [401, 403], "Expected 401 or 403")

        data = response.json()
        self.assertIn("detail", data)

