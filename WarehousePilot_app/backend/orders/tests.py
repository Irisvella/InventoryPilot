"""

This file includes:
- Tests for generating manufacturing and inventory lists (`GenerateListsTests`).
- Tests for retrieving inventory picklist items (`InventoryPicklistItemsViewTest`).
-Tests for retrieving inventory picklist ( A.K.A orders that have been started )

"""


from django.urls import reverse
from rest_framework.test import APITestCase
from .models import Orders, OrderPart
from inventory.models import Inventory
from parts.models import Part
from rest_framework import status
from datetime import date  
from inventory.models import  InventoryPicklist, InventoryPicklistItem
from auth_app.models import users
from rest_framework_simplejwt.tokens import RefreshToken


# Create your tests here.
class GenerateListsTests(APITestCase):
    def setUp(self):
        Orders.objects.create(order_id = 12345)
        
    def test_varied(self):
        print("___________ STARTING TEST test_varied _______________")
        order = Orders.objects.get(order_id = 12345)
        Part.objects.bulk_create(
            [
                Part(sku_color='equal to inventory'),
                Part(sku_color='more than inventory'),
                Part(sku_color='less than inventory'),
                Part(sku_color='not in inventory'),
            ]
        )
        parts = Part.objects.all()
        print("all created parts in test db:")
        for p in parts:
            print(p.sku_color)
        Inventory.objects.bulk_create(
            [
                Inventory(location = 'loc1Test', sku_color = parts[0], qty=10, warehouse_number = 'TestHouse', amount_needed = 0),
                Inventory(location = 'loc2Test', sku_color = parts[1], qty=3, warehouse_number = 'TestHouse', amount_needed = 0),
                Inventory(location = 'loc3Test', sku_color = parts[2], qty=8, warehouse_number = 'TestHouse', amount_needed = 0),
                Inventory(location = 'loc4Test', sku_color = parts[2], qty=12, warehouse_number = 'TestHouse', amount_needed = 0),
            ]
        )
        OrderPart.objects.bulk_create(
            [
                OrderPart(order_id = order, sku_color = parts[0], qty = 10),
                OrderPart(order_id = order, sku_color=parts[1], qty = 10),
                OrderPart(order_id = order, sku_color=parts[2], qty = 10),
                OrderPart(order_id = order, sku_color=parts[3], qty = 10),
            ]
        )
        url = reverse('generateLists')
        response = self.client.post(url, {'orderID' : '12345'}, format='json')
        print('varied test case')
        print(response.data)
        pass
        
    def test_no_inventory_picklist(self):
        print("___________ STARTING TEST test_no_inventory_picklist _______________")
        order = Orders.objects.get(order_id = 12345)
        Part.objects.bulk_create(
            [
                Part(sku_color='not in inventory'),
            ]
        )
        parts = Part.objects.all()
        print("all created parts in test db:")
        for p in parts:
            print(p.sku_color)
        OrderPart.objects.bulk_create(
            [
                OrderPart(order_id = order, sku_color = parts[0], qty = 10),
            ]
        )
        url = reverse('generateLists')
        response = self.client.post(url, {'orderID' : '12345'}, format='json')
        print('no inventory picklist test case')
        print(response.data)
        pass
        
    def test_no_manuList(self):
        print("___________ STARTING TEST test_no_manuList _______________")
        order = Orders.objects.get(order_id = 12345)
        Part.objects.bulk_create(
            [
                Part(sku_color='only in inventory'),
            ]
        )
        parts = Part.objects.all()
        print("all created parts in test db:")
        for p in parts:
            print(p.sku_color)
        Inventory.objects.bulk_create(
            [
                Inventory(location = 'loc3Test', sku_color = parts[0], qty=8, warehouse_number = 'TestHouse', amount_needed = 0),
                Inventory(location = 'loc4Test', sku_color = parts[0], qty=12, warehouse_number = 'TestHouse', amount_needed = 0),
            ]
        )
        OrderPart.objects.bulk_create(
            [
                OrderPart(order_id = order, sku_color = parts[0], qty = 5),
            ]
        )
        url = reverse('generateLists')
        response = self.client.post(url, {'orderID' : '12345'}, format='json')
        print('no manuList test case')
        print(response.data)
        pass   









class InventoryPicklistItemsViewTest(APITestCase):

    def setUp(self):
        #  a mock user
        self.user = users.objects.create_user(
            username="testuser",
            password="testpassword",
            email="testuser@example.com",
            role="Employee",
            date_of_hire="1990-01-01",
            first_name="Test",
            last_name="User",
            department="Inventory"
        )

        # JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        #  a mock order
        self.order = Orders.objects.create(
            order_id=1,
            status="Pending",
            due_date="2025-01-30",
            estimated_duration=5
        )

        #  a mock inventory picklist for the order
        self.picklist = InventoryPicklist.objects.create(
            order_id=self.order,
            assigned_employee_id=self.user,
            status=True
        )

        # a mock part
        self.part = Part.objects.create(
            sku_color="Blue",
            sku="ABC123",
            description="Test part",
            qty_per_box=10,
            weight=1.2
        )

        #  a mock inventory location
        self.location = Inventory.objects.create(
            location="A1",
            sku_color=self.part,
            qty=100,
            warehouse_number="W1",
            amount_needed=5
        )

        #  a mock inventory picklist item
        self.picklist_item = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist,
            location=self.location,
            sku_color=self.part,
            amount=5,
            status=False
        )

    def test_get_inventory_picklist_items_success(self):
        # Test successful retrieval of inventory picklist items
        url = reverse('inventory_picklist_items', kwargs={'order_id': self.order.order_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['location'], "A1")
        self.assertEqual(response.data[0]['sku_color'], "Blue")
        self.assertEqual(response.data[0]['quantity'], 5)
        self.assertEqual(response.data[0]['status'], False)
        print("test_get_inventory_picklist_items_success passed.")

    def test_get_inventory_picklist_items_order_not_found(self):
        # Test when the order does not exist
        url = reverse('inventory_picklist_items', kwargs={'order_id': 999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], "Order not found")
        print("test_get_inventory_picklist_items_order_not_found passed.")

    def test_get_inventory_picklist_items_no_picklist(self):
        # Test when no inventory picklist exists for the order
        order_without_picklist = Orders.objects.create(
            order_id=2,
            status="Pending",
            due_date="2025-02-01",
            estimated_duration=3
        )
        url = reverse('inventory_picklist_items', kwargs={'order_id': order_without_picklist.order_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], "No picklist found for the given order")
        print("test_get_inventory_picklist_items_no_picklist passed.")
        
        
        




class InventoryPicklistViewTest(APITestCase):
    def setUp(self):
        #  a mock user
        self.user = users.objects.create_user(
            username="testuser",
            password="password",
            email="testuser@example.com",
            role="Employee",
            date_of_hire="1990-01-01",
            first_name="Test",
            last_name="User",
            department="Inventory"
        )

        #  mock orders
        self.order1 = Orders.objects.create(order_id=1, status="In Progress", due_date=date(2025, 2, 15))
        self.order2 = Orders.objects.create(order_id=2, status="In Progress", due_date=date(2025, 2, 20))
        self.order3 = Orders.objects.create(order_id=3, status="Pending", due_date=date(2025, 3, 1))  # Not started

        #  a mock inventory picklist for order1 (partially filled)
        self.picklist1 = InventoryPicklist.objects.create(order_id=self.order1, assigned_employee_id=self.user, status=True)
        self.part1 = Part.objects.create(sku_color="Blue")
        self.item1 = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist1,
            location=None,
            sku_color=self.part1,
            amount=10,
            status=False
        )

        # a mock inventory picklist for order2 (completely filled)
        self.picklist2 = InventoryPicklist.objects.create(order_id=self.order2, assigned_employee_id=self.user, status=True)
        self.part2 = Part.objects.create(sku_color="Red")
        self.item2 = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist2,
            location=None,
            sku_color=self.part2,
            amount=5,
            status=True
        )

    def test_get_inventory_picklist_success(self):
        print("Running: test_get_inventory_picklist_success")
        # Authenticate as the user
        self.client.force_authenticate(user=self.user)

        url = reverse('inventory_picklist')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only `In Progress` orders should be included

        # Verify order1 details
        order1 = response.data[0]
        self.assertEqual(order1["order_id"], 1)
        self.assertFalse(order1["already_filled"])  # Partially filled
        self.assertEqual(order1["assigned_to"], "testuser")

        # Verify order2 details 
        order2 = response.data[1]
        self.assertEqual(order2["order_id"], 2)
        self.assertTrue(order2["already_filled"])  # Completely filled
        self.assertEqual(order2["assigned_to"], "testuser")

        print("Passed: test_get_inventory_picklist_success")

    def test_get_inventory_picklist_no_in_progress_orders(self):
        print("Running: test_get_inventory_picklist_no_in_progress_orders")
        # Update orders to have no "In Progress" status
        self.order1.status = "Completed"
        self.order1.save()
        self.order2.status = "Completed"
        self.order2.save()

        # Authenticate as the user
        self.client.force_authenticate(user=self.user)

        url = reverse('inventory_picklist')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # No "In Progress" orders

        print("Passed: test_get_inventory_picklist_no_in_progress_orders")

    def test_unauthenticated_access(self):
        print("Running: test_unauthenticated_access")
        # Test without authentication
        url = reverse('inventory_picklist')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        print("Passed: test_unauthenticated_access")
