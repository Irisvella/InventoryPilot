# This file defines views for handling manufacturing tasks.


# StaffManufacturingTasksView: Retrieves manufacturing tasks assigned to the logged-in staff member, categorized by process step (e.g., nesting, cutting, welding).



# Create your views here.
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from django.db.models import Q
from django.utils import timezone 

from manufacturingLists.models import ManufacturingTask

def index(request):
    return HttpResponse("Hello, world. You're at manufacturing lists index.")


import traceback

class StaffManufacturingTasksView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user  # Logged-in user
            print(f"Logged-in user: {user}, User ID: {user.user_id}")  # Debug

            if getattr(user, 'role', None) != 'staff':
                return Response(
                    {"error": "Unauthorized: User is not a staff member."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Filter tasks where the user is assigned to any process
            tasks = ManufacturingTask.objects.filter(
                Q(nesting_employee=user) |
                Q(bending_employee=user) |
                Q(cutting_employee=user) |
                Q(welding_employee=user) |
                Q(paint_employee=user)
            )
            print(f"Retrieved tasks: {tasks}")  # Debug

            response_data = []

            for task in tasks:
                print(f"Processing task {task.manufacturing_task_id}")  # Debug
                base_task_info = {
                    "manufacturing_id": task.manufacturing_task_id,
                    "qty": task.qty,
                    "sku_color": task.sku_color.sku_color,  # Use `sku_color` from the `Part` model
                }

                # Add rows for each process step assigned to the user
                if task.nesting_employee == user:
                    response_data.append({
                        **base_task_info,
                        "status": "nesting",
                        "end_time": task.nesting_end_time
                    })
                if task.cutting_employee == user:
                    response_data.append({
                        **base_task_info,
                        "status": "cutting",
                        "end_time": task.cutting_end_time
                    })
                if task.bending_employee == user:
                    response_data.append({
                        **base_task_info,
                        "status": "bending",
                        "end_time": task.bending_end_time
                    })
                if task.welding_employee == user:
                    response_data.append({
                        **base_task_info,
                        "status": "welding",
                        "end_time": task.welding_end_time
                    })
                if task.paint_employee == user:
                    response_data.append({
                        **base_task_info,
                        "status": "painting",
                        "end_time": task.paint_end_time
                    })

            print(f"Final response data: {response_data}")  # Debug
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            print(f"Error: {traceback.format_exc()}")  # Full traceback
            return Response(
                {"error": "An unexpected error occurred."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CompleteManufacturingTask(APIView):
    def post(self, request, task_id):
        try:
            # Retrieve the manufacturing task by ID
            task = get_object_or_404(ManufacturingTask, manufacturing_task_id=task_id)

            # Determine the current stage and update the status accordingly
            if task.status == "nesting":
                task.status = "bending"
                task.nesting_end_time = timezone.now()  # Set the timestamp for nesting
            elif task.status == "bending":
                task.status = "cutting"
                task.bending_end_time = timezone.now()  # Set the timestamp for bending
            elif task.status == "cutting":
                task.status = "welding"  # Default to welding
                task.cutting_end_time = timezone.now()  # Set the timestamp for cutting
            elif task.status == "welding":
                task.status = "production_qa"
                task.welding_end_time = timezone.now()  # Set the timestamp for welding
                task.prod_qa = True  # Ensure the 'prod_qa' field is updated
            elif task.status == "production_qa":
                return JsonResponse({"message": "Task is already at the Production QA stage!"}, status=400)

            # Save the updated task status and the relevant end time
            task.save()

            return JsonResponse({"message": f"Task status updated to {task.status}"}, status=200)

        except ManufacturingTask.DoesNotExist:
            return JsonResponse({"error": "Task not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


