"""
Test file for QA Dashboard Views in the qa_dashboard app.

This test suite verifies the following endpoints:
- QADashboardView: Ensures that authenticated QA users can access the dashboard and that unauthenticated requests are denied.
- QAManufacturingTasksView: Checks that QA users can retrieve manufacturing tasks and that non-QA users receive proper authorization errors.
- UpdateQATaskView: Tests that tasks can be updated correctly (both for successful updates and non-existent tasks).
- ReportQAErrorView: Verifies that reporting a QA error updates the task and creates a QA error report.
- UpdateQAStatusView: Confirms that tasks in error status can be updated and that proper error responses are returned for invalid requests.
- QAErrorListView: Ensures only authorized users (QA or Manager) can view error reports.
- ResolveQAErrorView: Checks that managers can resolve error reports, while unauthorized users are prevented.
- SendToPickAndPackView: Verifies that tasks in progress are correctly marked as “pick and pack” and that errors are returned when orders are missing or task status is invalid.
"""

from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from auth_app.models import users
from manufacturingLists.models import ManufacturingTask, QAErrorReport
from orders.models import Orders
from inventory.models import InventoryPicklist
from parts.models import Part  # Import the Part model

class QADashboardViewsTest(APITestCase):
    def setUp(self):
        # Create dummy users.
        self.qa_user = users.objects.create_user(
            username="qauser",
            password="password",
            email="qa@example.com",
            role="qa",
            date_of_hire="1990-01-01",
            first_name="QA",
            last_name="User",
            department="QA"
        )
        self.manager_user = users.objects.create_user(
            username="manager",
            password="password",
            email="manager@example.com",
            role="manager",
            date_of_hire="1990-01-01",
            first_name="Manager",
            last_name="User",
            department="Management"
        )
        self.other_user = users.objects.create_user(
            username="other",
            password="password",
            email="other@example.com",
            role="employee",
            date_of_hire="1990-01-01",
            first_name="Other",
            last_name="User",
            department="Sales"
        )

        # Create Part instances using SKU_COLOR values.
        self.part_primary = Part.objects.create(sku_color="jAP-EXTRU8")
        self.part_secondary = Part.objects.create(sku_color="BOL-LY9000")
        self.part_tertiary = Part.objects.create(sku_color="XDR-INT123")

        # Create an Order for SendToPickAndPackView tests.
        self.order = Orders.objects.create(
            order_id=1,
            status="In Progress",
            due_date=date(2025, 2, 15)
        )

        # Create a manufacturing task (not in progress) using the primary part.
        self.task = ManufacturingTask.objects.create(
            manufacturing_task_id=1,
            sku_color=self.part_primary, 
            qty=50,
            due_date=date(2025, 3, 1),
            prod_qa=False,
            paint_qa=False,
            status="pending",
            prod_qa_employee_id=self.qa_user.user_id,
            paint_qa_employee_id=self.qa_user.user_id,
        )

        # Create a manufacturing task with status "in progress" for SendToPickAndPackView using the secondary part.
        self.task_in_progress = ManufacturingTask.objects.create(
            manufacturing_task_id=2,
            sku_color=self.part_secondary,
            qty=30,
            due_date=date(2025, 3, 10),
            prod_qa=True,
            paint_qa=True,
            status="in progress",
            prod_qa_employee_id=self.qa_user.user_id,
            paint_qa_employee_id=self.qa_user.user_id,
        )

    # QADashboardView tests.
    def test_qadashboard_authenticated(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('qa_dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "Hello QA Dashboard! This is a placeholder."})

    def test_qadashboard_unauthenticated(self):
        url = reverse('qa_dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # QAManufacturingTasksView tests.
    def test_qa_tasks_view_with_qa_user(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('qa_tasks')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Both tasks should be returned since qa_user is assigned to either prod or paint QA.
        self.assertEqual(len(response.data), 2)
        # Validate details for manufacturing_task_id=1.
        task1 = next(item for item in response.data if item["manufacturing_task_id"] == 1)
        self.assertEqual(task1["prod_qa"], "pending")
        self.assertEqual(task1["paint_qa"], "pending")
        self.assertEqual(task1["final_qa"], "n/a")
        # Validate details for manufacturing_task_id=2 (in progress).
        task2 = next(item for item in response.data if item["manufacturing_task_id"] == 2)
        self.assertEqual(task2["final_qa"], "pending")
        self.assertEqual(task2["prod_qa"], "completed")
        self.assertEqual(task2["paint_qa"], "completed")

    def test_qa_tasks_view_with_non_qa_user(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('qa_tasks')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # UpdateQATaskView tests.
    def test_update_qa_task_view_success(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('update_qa_task')
        data = {
            "manufacturing_task_id": self.task.manufacturing_task_id,
            "prod_qa": "completed",
            "paint_qa": "completed"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertTrue(self.task.prod_qa)
        self.assertTrue(self.task.paint_qa)
        self.assertEqual(self.task.status, "in progress")

    def test_update_qa_task_view_not_found(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('update_qa_task')
        data = {
            "manufacturing_task_id": 9999,  # Non-existent ID.
            "prod_qa": "completed",
            "paint_qa": "completed"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ReportQAErrorView tests.
    def test_report_qa_error_view_success(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('report_qa_error')
        data = {
            "manufacturing_task_id": self.task.manufacturing_task_id,
            "subject": "Test Error",
            "comment": "There is a problem with the task."
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, "error")
        error_exists = QAErrorReport.objects.filter(
            manufacturing_task=self.task,
            subject="Test Error"
        ).exists()
        self.assertTrue(error_exists)

    def test_report_qa_error_view_not_found(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('report_qa_error')
        data = {
            "manufacturing_task_id": 9999,
            "subject": "Test Error",
            "comment": "Task not found."
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # UpdateQAStatusView tests.
    def test_update_qa_status_view_success(self):
        task_error = ManufacturingTask.objects.create(
            manufacturing_task_id=3,
            sku_color=self.part_tertiary,
            qty=20,
            due_date=date(2025, 3, 15),
            prod_qa=False,
            paint_qa=False,
            status="error",
            prod_qa_employee_id=self.qa_user.user_id,
            paint_qa_employee_id=self.qa_user.user_id,
        )
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('update_qa_status')
        data = {
            "manufacturing_task_id": task_error.manufacturing_task_id,
            "status": "in progress"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_error.refresh_from_db()
        self.assertEqual(task_error.status, "in progress")

    def test_update_qa_status_view_invalid_status(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('update_qa_status')
        data = {
            "manufacturing_task_id": self.task.manufacturing_task_id,
            "status": "in progress"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Task status must be 'error'", response.data.get("error", ""))

    def test_update_qa_status_view_missing_fields(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('update_qa_status')
        data = {}  # Missing both manufacturing_task_id and status.
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # QAErrorListView tests.
    def test_qa_error_list_view_authorized(self):
        # Create some QA error reports.
        QAErrorReport.objects.create(
            manufacturing_task=self.task,
            subject="Error 1",
            comment="Error comment 1",
            reported_by=self.qa_user
        )
        QAErrorReport.objects.create(
            manufacturing_task=self.task,
            subject="Error 2",
            comment="Error comment 2",
            reported_by=self.qa_user
        )
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('qa-error-reports')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_qa_error_list_view_unauthorized(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('qa-error-reports')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ResolveQAErrorView tests.
    def test_resolve_qa_error_view_success(self):
        error_report = QAErrorReport.objects.create(
            manufacturing_task=self.task,
            subject="Error to resolve",
            comment="Resolve this error",
            reported_by=self.qa_user
        )
        self.client.force_authenticate(user=self.manager_user)
        url = reverse('resolve-qa-error')
        data = {"error_id": error_report.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(QAErrorReport.objects.filter(id=error_report.id).exists())

    def test_resolve_qa_error_view_unauthorized(self):
        error_report = QAErrorReport.objects.create(
            manufacturing_task=self.task,
            subject="Error not resolved",
            comment="Should not resolve",
            reported_by=self.qa_user
        )
        self.client.force_authenticate(user=self.qa_user)  # Not a manager.
        url = reverse('resolve-qa-error')
        data = {"error_id": error_report.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_resolve_qa_error_view_missing_error_id(self):
        self.client.force_authenticate(user=self.manager_user)
        url = reverse('resolve-qa-error')
        data = {}  # Missing error_id.
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_qa_error_view_not_found(self):
        self.client.force_authenticate(user=self.manager_user)
        url = reverse('resolve-qa-error')
        data = {"error_id": 9999}  # Non-existent error report.
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # SendToPickAndPackView tests.
    def test_send_to_pick_and_pack_view_success(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('send_to_pick_and_pack')
        data = {"manufacturing_task_id": self.task_in_progress.manufacturing_task_id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify that the task status is updated to "pick and pack".
        self.task_in_progress.refresh_from_db()
        self.assertEqual(self.task_in_progress.status, "pick and pack")
        self.assertIn("picklist_id", response.data)

    def test_send_to_pick_and_pack_view_missing_task_id(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('send_to_pick_and_pack')
        data = {}  # Missing manufacturing_task_id.
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_to_pick_and_pack_view_invalid_task_status(self):
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('send_to_pick_and_pack')
        data = {"manufacturing_task_id": self.task.manufacturing_task_id}  # self.task.status is "pending".
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Task QA is not in progress", response.data.get("error", ""))

    def test_send_to_pick_and_pack_view_no_order(self):
        # Delete all orders so that none exist.
        Orders.objects.all().delete()
        self.client.force_authenticate(user=self.qa_user)
        url = reverse('send_to_pick_and_pack')
        data = {"manufacturing_task_id": self.task_in_progress.manufacturing_task_id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No Order available", response.data.get("error", ""))




