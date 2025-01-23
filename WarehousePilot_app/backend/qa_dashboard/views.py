from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from django.db.models import Q

from manufacturingLists.models import ManufacturingTask, QAErrorReport


class QADashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Hello QA Dashboard! This is a placeholder."})


class QAManufacturingTasksView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            print(f"User type: {type(user)}")  # Debugging
            print(f"User attributes: {dir(user)}")
            print(f"User role: {getattr(user, 'role', 'No role attribute found')}")
            print(f"User ID: {user.user_id}")

            # Check if the user is indeed QA
            if not hasattr(user, 'role') or getattr(user, 'role', '').lower() != 'qa':
                return Response({"error": "Unauthorized: User is not a QA staff member."},
                                status=status.HTTP_403_FORBIDDEN)

            tasks = ManufacturingTask.objects.filter(
                Q(prod_qa_employee_id=user.user_id) |
                Q(paint_qa_employee_id=user.user_id)
            )

            response_data = []
            for task in tasks:
                response_data.append({
                    "manufacturing_task_id": task.manufacturing_task_id,
                    "sku_color_id": task.sku_color_id,
                    "qty": task.qty,
                    "due_date": task.due_date,
                    "prod_qa": "Completed" if task.prod_qa else "Pending",
                    "paint_qa": "Completed" if task.paint_qa else "Pending",
                    "status": task.status,
                })

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response({"error": "An unexpected error occurred."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateQATaskView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            print("Received data:", request.data)
            task_id = request.data.get("manufacturing_task_id")
            prod_qa = request.data.get("prod_qa")     # "Completed" or "Pending"
            paint_qa = request.data.get("paint_qa")  # "Completed" or "Pending"

            task = ManufacturingTask.objects.get(manufacturing_task_id=task_id)

            # Update booleans if provided
            if prod_qa in ["Completed", "Pending"]:
                task.prod_qa = (prod_qa == "Completed")

            if paint_qa in ["Completed", "Pending"]:
                task.paint_qa = (paint_qa == "Completed")

            # If both QA are completed, set status to Completed; otherwise In Progress
            if task.prod_qa and task.paint_qa:
                task.status = 'Completed'
            else:
                task.status = 'In Progress'

            task.save()
            return Response({"message": "QA task updated successfully."},
                            status=status.HTTP_200_OK)

        except ManufacturingTask.DoesNotExist:
            return Response({"error": "Task not found."},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportQAErrorView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            task_id = request.data.get("manufacturing_task_id")
            subject = request.data.get("subject")  # new fields
            comment = request.data.get("comment")

            task = ManufacturingTask.objects.get(manufacturing_task_id=task_id)

            # Mark the task as 'Error'
            task.status = 'Error'
            task.save()

            
            QAErrorReport.objects.create(
                manufacturing_task=task,
                subject=subject,
                comment=comment,
                reported_by=request.user
            )

            return Response({"message": "QA error reported."}, status=status.HTTP_200_OK)

        except ManufacturingTask.DoesNotExist:
            return Response({"error": "Task not found."},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error while reporting QA issue: {str(e)}")
            return Response({"error": "An error occurred while reporting the issue."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


