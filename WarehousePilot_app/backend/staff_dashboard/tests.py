"""
Unit tests for the StaffManufacturingTasksView API endpoint.

This file contains tests to validate the functionality of the
StaffManufacturingTasksView, ensuring:
- Staff users can retrieve tasks they are assigned to.
- Non-staff users are denied access.
- Unauthenticated users are denied access.


Each test covers different scenarios for task retrieval, role-based
permissions, and proper response formatting.
"""

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from inventory.models import users, Part
from manufacturingLists.models import ManufacturingTask
from parts.models import Part
from auth_app.models import users
from django.utils import timezone
from datetime import timedelta


class StaffManufacturingTasksViewTest(APITestCase):

    def setUp(self):
        # Create a staff user
        self.staff_user = users.objects.create_user(
            username="staffuser",
            password="password",
            email="staffuser@example.com",
            role="staff",
            dob="1990-01-01",
            first_name="Staff",
            last_name="User",
            department="Manufacturing"
        )

        # Create a non-staff user
        self.non_staff_user = users.objects.create_user(
            username="nonstaffuser",
            password="password",
            email="nonstaffuser@example.com",
            role="employee",
            dob="1990-01-01",
            first_name="NonStaff",
            last_name="User",
            department="Inventory"
        )

        # Create a part
        self.part = Part.objects.create(
            sku_color="Red",
            sku="SKU123",
            description="Test part",
            qty_per_box=10,
            weight=1.5
        )

        # Create manufacturing tasks with timezone-aware datetimes
        self.task1 = ManufacturingTask.objects.create(
            sku_color=self.part,
            qty=100,
            due_date=timezone.now().date() + timedelta(days=5),
            status="nesting",
            nesting_employee=self.staff_user,
            nesting_end_time=timezone.now() + timedelta(days=1)
        )
        self.task2 = ManufacturingTask.objects.create(
            sku_color=self.part,
            qty=50,
            due_date=timezone.now().date() + timedelta(days=10),
            status="cutting",
            cutting_employee=self.staff_user,
            cutting_end_time=timezone.now() + timedelta(days=2)
        )

    def test_staff_user_can_access_tasks(self):
        # Authenticate as staff user
        self.client.force_authenticate(user=self.staff_user)

        url = reverse('staff_manufacturing_tasks/')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check task1 details
        task1 = response.data[0]
        self.assertEqual(task1["manufacturing_id"], self.task1.manufacturing_task_id)
        self.assertEqual(task1["qty"], 100)
        self.assertEqual(task1["sku_color"], "Red")
        self.assertEqual(task1["status"], "nesting")

        # Check task2 details
        task2 = response.data[1]
        self.assertEqual(task2["manufacturing_id"], self.task2.manufacturing_task_id)
        self.assertEqual(task2["qty"], 50)
        self.assertEqual(task2["sku_color"], "Red")
        self.assertEqual(task2["status"], "cutting")


    def test_non_staff_user_cannot_access_tasks(self):
        # Authenticate as non-staff user
        self.client.force_authenticate(user=self.non_staff_user)

        url = reverse('staff_manufacturing_tasks/')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Unauthorized: User is not a staff member.")

    def test_unauthenticated_user_cannot_access_tasks(self):
        url = reverse('staff_manufacturing_tasks/')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
