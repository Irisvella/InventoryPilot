import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning, module="django.db.models.fields")

from django.test import TestCase, Client
from django.urls import reverse
from inventory.models import Inventory, InventoryPicklist, InventoryPicklistItem
from parts.models import Part
from orders.models import Orders
from auth_app.models import users
from django.utils import timezone
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

class KPIDashboardTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create test data for related models
        self.part = Part.objects.create(
            sku_color='TEST01',
            sku='TEST',
            description='Test Part'
        )
        self.order = Orders.objects.create(
            order_id=1,  # Explicitly set as per previous fix
            due_date=timezone.now(),
            status='In Progress',
            estimated_duration=5,
            start_timestamp=timezone.now()  # Aware datetime provided here
        )
        # Provide all required fields for users model
        self.user = users.objects.create(
            username='testuser',
            email='test@example.com',
            role='staff',
            date_of_hire=date(2023, 1, 1),
            first_name='Test',
            last_name='User',
            department='Warehouse'
        )
        self.inventory = Inventory.objects.create(
            inventory_id=1,
            location='TESTLOC',
            sku_color=self.part,
            qty=100,
            warehouse_number='WH001',
            amount_needed=50
        )
        self.picklist = InventoryPicklist.objects.create(
            order_id=self.order,
            assigned_employee_id=self.user,
            status=False
        )

        # Create InventoryPicklistItem entries for testing
        self.picklist_item1 = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist,
            location=self.inventory,
            sku_color=self.part,
            amount=10,
            status=True,  # Picked
            picked_at=timezone.now() - timedelta(days=1)  # Picked yesterday
        )
        self.picklist_item2 = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist,
            location=self.inventory,
            sku_color=self.part,
            amount=5,
            status=False  # Not picked
        )
        self.picklist_item3 = InventoryPicklistItem.objects.create(
            picklist_id=self.picklist,
            location=self.inventory,
            sku_color=self.part,
            amount=8,
            status=True,  # Picked
            picked_at=timezone.now()  # Picked today
        )

    def test_order_picking_accuracy(self):
        response = self.client.get(reverse('order_picking_accuracy'))
        self.assertEqual(response.status_code, 200)

        data = response.json()
        total_picks = InventoryPicklistItem.objects.count()  # 3 items
        accurate_picks = InventoryPicklistItem.objects.filter(status=True).count()  # 2 items
        expected_accuracy = (accurate_picks / total_picks * 100) if total_picks > 0 else 0

        self.assertEqual(data['accurate_picks'], 2)
        self.assertEqual(data['inaccurate_picks'], 1)
        self.assertEqual(data['accuracy_percentage'], round(expected_accuracy, 2))
        self.assertEqual(data['target_accuracy'], 99)

    def test_daily_picks_data(self):
        response = self.client.get(reverse('daily_picks_data'))
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Expect two days of data (yesterday and today)
        self.assertEqual(len(data), 2)

        yesterday = (timezone.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        today = timezone.now().strftime("%Y-%m-%d")

        yesterday_data = next((item for item in data if item['day'] == yesterday), None)
        today_data = next((item for item in data if item['day'] == today), None)

        self.assertIsNotNone(yesterday_data)
        self.assertEqual(yesterday_data['picks'], 1)

        self.assertIsNotNone(today_data)
        self.assertEqual(today_data['picks'], 1)

    def test_daily_picks_data_method_not_allowed(self):
        response = self.client.post(reverse('daily_picks_data'))
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['error'], "Method not allowed")

    def test_daily_picks_details(self):
        response = self.client.get(reverse('daily_picks_details'))
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)

        # Expect two entries (one for yesterday, one for today)
        self.assertEqual(len(data), 2)

        yesterday = (timezone.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        today = timezone.now().strftime("%Y-%m-%d")

        yesterday_data = next((item for item in data if item['day'] == yesterday), None)
        today_data = next((item for item in data if item['day'] == today), None)

        self.assertIsNotNone(yesterday_data)
        self.assertEqual(yesterday_data['order_id'], str(self.order.order_id))
        self.assertEqual(yesterday_data['picks'], 1)

        self.assertIsNotNone(today_data)
        self.assertEqual(today_data['order_id'], str(self.order.order_id))
        self.assertEqual(today_data['picks'], 1)

    def test_daily_picks_details_method_not_allowed(self):
        response = self.client.post(reverse('daily_picks_details'))
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['error'], "Method not allowed")

    def test_order_picking_accuracy_empty(self):
        InventoryPicklistItem.objects.all().delete()
        response = self.client.get(reverse('order_picking_accuracy'))
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data['accurate_picks'], 0)
        self.assertEqual(data['inaccurate_picks'], 0)
        self.assertEqual(data['accuracy_percentage'], 0)
        self.assertEqual(data['target_accuracy'], 99)

    def test_order_fulfillment_rate_get(self):
        self.order.start_timestamp = timezone.now() - timedelta(days=1)
        self.order.save()

        url = reverse('order_fulfillment_rate')
        response = self.client.get(url, {'filter': 'day', 'date': self.order.start_timestamp.strftime("%Y-%m-%d")})
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        day_str = self.order.start_timestamp.strftime("%Y-%m-%d")
        day_entry = next((item for item in data if item['period'] == day_str), None)
        self.assertIsNotNone(day_entry)
        self.assertGreaterEqual(day_entry['total_orders_started'], 1)

    def test_order_fulfillment_rate_invalid_date(self):
        url = reverse('order_fulfillment_rate')
        response = self.client.get(url, {'filter': 'day', 'date': 'invalid-date'})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid date format", data.get("error", ""))

    def test_order_fulfillment_rate_method_not_allowed(self):
        url = reverse('order_fulfillment_rate')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
        
    def test_active_orders_get(self):
        self.order.start_timestamp = timezone.now() - timedelta(days=10)
        self.order.save()
        url = reverse('active_orders')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        if data:
            sample = data[0]
            self.assertIn("date", sample)
            self.assertIn("active_orders", sample)

    def test_active_orders_method_not_allowed(self):
        url = reverse('active_orders')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
    
    def test_completed_orders_get(self):
        self.order.start_timestamp = timezone.now() - timedelta(days=5)
        self.order.save()

        completed_order = Orders.objects.create(
            order_id=2,
            due_date=timezone.now(),
            status='Completed',
            estimated_duration=5,
            start_timestamp=timezone.now() - timedelta(days=5)
        )

        completed_picklist = InventoryPicklist.objects.create(
            order_id=completed_order,
            assigned_employee_id=self.user,
            status=True,
            picklist_complete_timestamp=timezone.now() - timedelta(days=4)
        )

        url = reverse('completed_orders')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        if data:
            sample = data[0]
            self.assertIn("date", sample)
            self.assertIn("completed_orders", sample)

    def test_completed_orders_method_not_allowed(self):
        url = reverse('completed_orders')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
        
    def test_active_orders_details_get(self):
        self.order.start_timestamp = timezone.now() - timedelta(days=5)
        self.order.save()
        url = reverse('active_orders_details')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        if data:
            sample = data[0]
            self.assertIn("order_id", sample)
            self.assertIn("start_date", sample)
            self.assertIn("due_date", sample)
            self.assertIn("assigned_employee", sample)
            self.assertIn("items", sample)
            if sample["items"]:
                item_sample = sample["items"][0]
                self.assertIn("sku_color", item_sample)
                self.assertIn("quantity", item_sample)
                self.assertIn("location", item_sample)
                self.assertIn("status", item_sample)

    def test_active_orders_details_method_not_allowed(self):
        url = reverse('active_orders_details')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
    
    
    

    