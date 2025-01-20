from django.shortcuts import get_object_or_404
from datetime import datetime
from django.shortcuts import render
from rest_framework.views import APIView
from django.http import HttpResponse
from rest_framework.response import Response
from .models import Orders, OrderPart
from inventory.models import Inventory, InventoryPicklist, InventoryPicklistItem
from parts.models import Part
from manufacturingLists.models import ManufacturingLists, ManufacturingListItem
from django.db.models import Sum
from django.db.models import Q
from rest_framework import status

from django.http import JsonResponse
from django.db import connection
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone 

from django.shortcuts import get_object_or_404
from datetime import datetime
from django.utils import timezone 

#generates an inventory picklist and a maufacturing list of an order once the order is "started"
# Note: print statements have been commented out and can be uncommented for debugging if needed
class GenerateInventoryAndManufacturingListsView(APIView):
    def post(self, request):
        #retrieve the order id from the http request
        orderID = request.data.get("orderID")
        print("GenerateInventoryAndManufacturingListsView")
        print(f"Response OrderID: {orderID}")
        #retrieve the order object from the database using the order id
        order = Orders.objects.get(order_id=orderID)
        print(f'retrieved order: {order.__dict__}')
        
        #get all the parts of the order
        orderParts = OrderPart.objects.filter(order_id=order)
        #'''
        print("Order Parts:")
        for op in orderParts:
            print(op.__dict__)
        #'''
        #get a list of the UNIQUE sku_colors from the parts in the order
        #***
        orderPartSkuColor = list(set(orderParts.values_list('sku_color', flat=True)))
        #'''
        print("unique Order Parts SKU COLORS:")
        for sku in orderPartSkuColor:
            print(sku)
        #'''
        #get all the objects in inventory that have a quantity greater than 0, amount needed equal to 0 and match the sku_colors of the parts in the order
        inventory = Inventory.objects.filter(sku_color__in=orderPartSkuColor, qty__gt = 0, amount_needed = 0)
        #'''
        print("Matching parts in inventory with a quantity greater than 0:")
        for i in inventory:
            print(i.__dict__)
        
        print(f"inventory.count(): {inventory.count()}")
        #'''
        if inventory.exists() == True: #if there were matching objects in inventory
            print("ENTER 1st IF BLOCK")
            #find all the unique skus in the matching inventory objects, since there can be more than one object in inventory with the same sku
            inventorySkus = set(list(inventory.values_list("sku_color", flat=True)))
            print(f"inventory matching skus: {inventorySkus}")
            #create an inventory picklist for the order
            inventoryPicklist = InventoryPicklist.objects.create(status = False, order_id=order)
            # create a list of picklist items
            manufacturingList= ManufacturingLists(order_id=order, status='Pending')
            inventoryPicklistItems = []
            manuListItems = []
            for s in inventorySkus: #loop through the unique matching inventory sku set
                # find the total of the quantity of each unique sku in inventory, aggregating all the inventory objects with the same sku together
                totalInventoryQty = Inventory.objects.filter(sku_color=Part.objects.get(sku_color=s)).aggregate(total=Sum('qty'))['total']
                print(f"total inventory qty: {totalInventoryQty}")
                ##orderQty = OrderPart.objects.get(order_id=order, sku_color=s).__getattribute__("qty")
                orderQty = OrderPart.objects.filter(order_id=order, sku_color=s).aggregate(total=Sum('qty'))['total']
                print(f"total order qty: {orderQty}")

                #if inventory amount exceeds needed amount, only the needed amount will be chosen, and if needed amount exceeds available amount, only the available amount is chosen
                manuListItemQty = 0
                if orderQty <= totalInventoryQty:
                    picklistQty = orderQty
                    print(f"picklist qty: {picklistQty}")
                else: #amount needed exceeds amount available in inventory
                    picklistQty = totalInventoryQty
                    print(f"picklist qty: {picklistQty}")
                    #create a manufacturing list item with the remaining amount needed for the order
                    manuListItemQty = orderQty - picklistQty
                    print(f"manuList qty: {manuListItemQty}")
                    manuListItems.append(ManufacturingListItem(manufacturing_list_id=manufacturingList, sku_color=Part.objects.get(sku_color=s), amount=manuListItemQty))
                    for x in Inventory.objects.filter(sku_color=s):
                        x.amount_needed=manuListItemQty
                        x.save()

                #add the picklist item with the appropriate amount to the list of inventory picklist items
                inventoryPicklistItems.append(InventoryPicklistItem(picklist_id = inventoryPicklist, sku_color=Part.objects.get(sku_color=s), amount = picklistQty, status = False))
            #bulk create all the inventory picklist items in the database
            InventoryPicklistItem.objects.bulk_create(inventoryPicklistItems)
            #'''
            print("All Picklist Items:")
            for i in InventoryPicklistItem.objects.filter(picklist_id=inventoryPicklist): #print all the picklist items
                print(i.__dict__)
            #'''
            if len(manuListItems) > 0:
                print("**Creating manufacturing list 1st if block")
                manufacturingList.save()
                ManufacturingListItem.objects.bulk_create(manuListItems)
                
        print(f"orderPartSkuColor): {orderPartSkuColor}")
        print(f"orderPartSkuColor len: {len(orderPartSkuColor)}")
        invSkuLen = len(set(list(inventory.values_list("sku_color", flat=True))))
        print(f"matching inventory sku len): {invSkuLen}")
        #if not all the parts in the order matched with the parts in inventory, then we have remaining parts that need to be in the manufacturing list
        if inventory.exists() == False or (len((set(orderPartSkuColor)) - set(list(inventory.values_list("sku_color", flat=True)))) > 0):
            print("ENTER 2nd IF BLOCK")
            invSkuLen = len(set(list(inventory.values_list("sku_color", flat=True))))
            print(f"matching inventory sku len): {invSkuLen}")
            print(f"orderPartSkuColor): {len(orderPartSkuColor)}")
            #create the manufacturing list if it is not already created
            if (ManufacturingLists.objects.filter(order_id=order).exists()) == False:
                print("**Creating manufacturing list 2nd if block")
                manuList = ManufacturingLists.objects.create(status = 'Pending', order_id=order)
            else: #retrieve the manufacturing list if it already exists
                manuList = ManufacturingLists.objects.get(order_id=order)
            manuListItems= [] #create list of manufacturing list items
            #if there is no inventory picklist for the order, then create all the parts in the order as manufacturing list items
            print(f"Is there a picklist?: {InventoryPicklist.objects.filter(order_id=order).exists()}")
            if (InventoryPicklist.objects.filter(order_id=order).exists()) == False:
                print("there is no picklist")
                for s in orderPartSkuColor:
                    print(f"add manuList item {s}")
                    ##orderQty = OrderPart.objects.get(order_id=order, sku_color=s).__getattribute__("qty")
                    orderQty = OrderPart.objects.filter(order_id=order, sku_color=s).aggregate(total=Sum('qty'))['total']
                    manuListItems.append(ManufacturingListItem(sku_color=Part.objects.get(sku_color=s), manufacturing_list_id = manuList, amount=orderQty))
            else: #otherwise if there is an inventory picklist for the order, for the remaining order parts that did not get compared to the inventory items earlier (line 42 if block), make the manufacturing list item for them
                print("there was a picklist")
                inventoryPicklist = InventoryPicklist.objects.get(order_id=order)
                inventoryPicklistSkus = InventoryPicklistItem.objects.filter(picklist_id = inventoryPicklist).values_list('sku_color', flat=True)
                #***
                manuSkus = list(set(OrderPart.objects.filter(Q(order_id = order) & ~Q(sku_color__in = inventoryPicklistSkus)).values_list('sku_color', flat=True)))
                print(f"manuSkus: {manuSkus}")
                for s in manuSkus:
                    ##orderQty = OrderPart.objects.get(order_id=order, sku_color=Part.objects.get(sku_color=s)).__getattribute__("qty")
                    orderQty = OrderPart.objects.filter(order_id=order, sku_color=s).aggregate(total=Sum('qty'))['total']
                    print("add manuList item")
                    manuListItems.append(ManufacturingListItem(sku_color=Part.objects.get(sku_color=s), manufacturing_list_id=manuList, amount = orderQty))
            ManufacturingListItem.objects.bulk_create(manuListItems)
        #create empty inventory picklist for the order
        inventoryPicklist = InventoryPicklist.objects.get_or_create(status = False, order_id=order)

        #'''
        try:
            manuList = ManufacturingLists.objects.get(order_id = order)
        except ManufacturingLists.DoesNotExist:
            manuList = None
        print(f"manufacturing list object: {manuList}")
        if manuList != None:
            print("All Manufacturing List Items:")
            for m in ManufacturingListItem.objects.filter(manufacturing_list_id = manuList):
                print(m.__dict__)
        #'''
        return Response({'detail':'inventory picklist and manufacturing list generation successful'}, status=status.HTTP_200_OK)


class OrdersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Query to fetch order data
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT order_id, estimated_duration, status, due_date, start_timestamp
                    FROM orders_orders
                """)
                result = cursor.fetchall()

            # Process the result and return as JSON
            inventory_data = [{
                "order_id": row[0],
                "estimated_duration": row[1],
                "status": row[2],
                "due_date": row[3],
                "start_timestamp": row[4] if row[4] else None, 
            } for row in result]

            return Response(inventory_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
        

class StartOrderView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = get_object_or_404(Orders, order_id=order_id)

            if order.status == 'In Progress':
                return JsonResponse({'status': 'error', 'message': 'Order is already in progress'}, status=400)

            # Update order status and set timestamp
            order.status = 'In Progress'
            order.start_timestamp = timezone.now()  # Use timezone.now() instead of datetime.now()
            order.save()

            # Return success response with the updated order data
            return JsonResponse({
                'status': 'success',  # Overall success of the action
                'order_id': order.order_id,
                'order_status': order.status,  # Changed this from 'status' to 'order_status'
                'start_timestamp': order.start_timestamp.isoformat()  # ISO 8601 formatted timestamp
            })

        except Exception as e:
            # In case of any error, return error details
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
        


class InventoryPicklistView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Fetch started orders (status='In Progress') and their picklists
            started_orders = Orders.objects.filter(status='In Progress').values(
                'order_id', 'due_date'
            )

            # Build response data with additional fields `already_filled` and `assigned_to`
            response_data = [
                {
                    "order_id": order['order_id'],
                    "due_date": order['due_date'],
                    # Determine if the picklist is filled (all items are marked as `True`)
                    "already_filled": InventoryPicklistItem.objects.filter(
                        picklist_id__order_id=order['order_id'], status=False
                    ).exists() == False,
                    # Get the assigned employee from the picklist, if any
                    "assigned_to": InventoryPicklist.objects.filter(
                        order_id=order['order_id']
                    ).values_list('assigned_employee_id__username', flat=True).first()
                }
                for order in started_orders
            ]

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class InventoryPicklistView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             # Fetch all inventory picklists
#             inventory_picklists = InventoryPicklist.objects.select_related('order_id', 'assigned_employee_id').all()

#             # Build response data
#             response_data = [
#                 {
                    
#                     "order_id": picklist.order_id.order_id,  # From related Orders model
#                     "due_date": picklist.order_id.due_date,  # From related Orders model
#                     "already_filled": not InventoryPicklistItem.objects.filter(
#                         picklist_id=picklist.picklist_id, status=False
#                     ).exists(),  # Determine if all items are marked as filled
#                     "assigned_to": picklist.assigned_employee_id.username if picklist.assigned_employee_id else "Unassigned",
#                 }
#                 for picklist in inventory_picklists
#             ]

#             return Response(response_data, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class InventoryPicklistItemsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            # Fetch the order based on the provided order_id
            order = Orders.objects.get(order_id=order_id)

            # Fetch the inventory picklist associated with the order
            picklist = InventoryPicklist.objects.get(order_id=order)

            # Fetch picklist items for the given picklist
            picklist_items = InventoryPicklistItem.objects.filter(
                picklist_id=picklist.picklist_id
            ).values(
                'picklist_item_id',
                'location__location',
                'sku_color__sku_color',
                'amount',
                'status'
            )

            # Build response data
            response_data = [
                {
                    "picklist_item_id": item['picklist_item_id'],
                    "location": item['location__location'],
                    "sku_color": item['sku_color__sku_color'],
                    "quantity": item['amount'],
                    "status": item['status']
                }
                for item in picklist_items
            ]

            return Response(response_data, status=status.HTTP_200_OK)

        except Orders.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except InventoryPicklist.DoesNotExist:
            return Response(
                {"error": "No picklist found for the given order"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


