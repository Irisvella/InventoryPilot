import logging
from django.http import JsonResponse
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework import status
from django.middleware.csrf import get_token
from .models import InventoryPicklist, InventoryPicklistItem, Inventory
from .serializers import OrderSerializer
from auth_app.models import users


logger = logging.getLogger(__name__)

# def send_alert(item):
#     send_mail(
#         'Low Stock Alert',
#         f'The stock for {item["sku_color_id"]} is low. Current quantity: {item["qty"]}.',
#         'wp.notifs@gmail.com',
#         ['warehousepilot2024@gmail.com'],
#         fail_silently=False,
#     )


from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


def get_inventory(request):
    try:
        inventory_data = Inventory.objects.all().values()
        inventory_list = list(inventory_data)
        low_stock_items = []
        for item in inventory_list:
            qty = item['qty']
            if qty == 0:
                item['status'] = 'Out of Stock'
            elif qty < 50:
                item['status'] = 'Low'
                low_stock_items.append(item)
                # send_alert(item)
            elif 50 <= qty <= 100:
                item['status'] = 'Moderate'
            else:
                item['status'] = 'High'
        return JsonResponse({"inventory": inventory_list, "low_stock_items": low_stock_items}, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def delete_inventory_items(request):
    try:
        data = json.loads(request.body)
        item_ids = data.get('item_ids', [])
        Inventory.objects.filter(inventory_id__in=item_ids).delete()
        return JsonResponse({"message": "Items deleted successfully"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def add_inventory_item(request):
    try:
        data = json.loads(request.body)
        new_item = Inventory.objects.create(
            location=data["location"],
            sku_color_id=data["sku_color_id"],
            qty=data["qty"],
            warehouse_number=data["warehouse_number"],
            amount_needed=data["amount_needed"],
        )
        return JsonResponse({"message": "Item added successfully", "item": new_item.inventory_id}, status=201)
    except Exception as e:
        logger.error("Failed to add inventory item: %s", str(e))
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def add_inventory_item(request):
    try:
        data = json.loads(request.body)
        new_item = Inventory.objects.create(
            location=data["location"],
            sku_color_id=data["sku_color_id"],
            qty=data["qty"],
            warehouse_number=data["warehouse_number"],
            amount_needed=data["amount_needed"],
        )
        return JsonResponse({"message": "Item added successfully", "item": new_item.inventory_id}, status=201)
    except Exception as e:
        logger.error("Failed to add inventory item: %s", str(e))
        return JsonResponse({"error": str(e)}, status=500)

def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

class InventoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Query to fetch inventory data with inventory_id
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT inventory_id, sku_color_id, qty, warehouse_number
                    FROM inventory_inventory
                """)
                result = cursor.fetchall()

            # Process the result and return as JSON
            inventory_data = [{
                "inventory_id": row[0],  # Include inventory_id in the result
                "sku_color_id": row[1],
                "qty": row[2],
                "warehouse_number": row[3],
            } for row in result]
            
            return Response(inventory_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class AssignOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        print(f"[DEBUG] order_id from URL: {order_id}")
        user_id = request.data.get('user_id')
        print(f"[DEBUG] user_id from body: {user_id}")
        if not user_id:
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = InventoryPicklist.objects.get(order_id=order_id)
        except InventoryPicklist.DoesNotExist:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            staff_user = users.objects.get(user_id=user_id, role='staff')
        except users.DoesNotExist:
            return Response({"detail": "Staff user not found"}, status=status.HTTP_404_NOT_FOUND)

        order.assigned_employee_id = staff_user
        order.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AssignedPicklistView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            current_user = request.user
            # Find picklists assigned to this user
            assigned_picklists = InventoryPicklist.objects.filter(
                assigned_employee_id=current_user,               
                order_id__status='In Progress'                  
            )

            response_data = []
            for picklist in assigned_picklists:
                order = picklist.order_id  
                response_data.append({
                    "order_id": order.order_id,
                    "due_date": order.due_date,
                    "already_filled": not InventoryPicklistItem.objects.filter(
                        picklist_id=picklist.picklist_id,
                        status=False
                    ).exists(),
                    "assigned_to": picklist.assigned_employee_id.first_name + " " + picklist.assigned_employee_id.last_name if picklist.assigned_employee_id else None
                })

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class PickPicklistItemView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, picklist_item_id):
        try:
            item = InventoryPicklistItem.objects.get(picklist_item_id=picklist_item_id)
        except InventoryPicklistItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != 'staff':
            return Response({"error": "Not allowed. You need login as a staff "}, status=403)

        item.status = True
        item.save()

        return Response({"message": "Item picked successfully"}, status=status.HTTP_200_OK)