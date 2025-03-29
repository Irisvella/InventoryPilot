# This file defines views for employee activity logging 
# InventoryPickingLogging(): Track the picking activity of employees in the warehouse

import logging
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from inventory.models import InventoryPicklist, InventoryPicklistItem, Inventory
from rest_framework import status

# Django logger for backend
logger = logging.getLogger('WarehousePilot_app')

class InventoryPickingLogging(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Initialize the list of picklist items
        picked_items = []

        try:
            # Fetch all the picklists
            picklists = InventoryPicklist.objects.all().values('picklist_id', 'warehouse_nb', 'assigned_employee_id').filter(assigned_employee_id__isnull=False).order_by('-picklist_id')

            try:
                for picklist in picklists:
                    # Set the values for the following variables
                    id = picklist['picklist_id']
                    warehouse = '499' if picklist['warehouse_nb'] is None else picklist['warehouse_nb']
                    employee_id = picklist['assigned_employee_id']

                    # Fetch all the picklist items for each picklist
                    picklist_items = InventoryPicklistItem.objects.all().filter(picklist_id=id, status=True).values('picked_at', 'location', 'sku_color', 'amount')

                    # Formatting picklist item information to be returned in picked_items
                    for item in picklist_items:
                        try:
                            # Fetch the location for each item
                            location = Inventory.objects.all().filter(sku_color_id=item['sku_color'], location__isnull=False).values('location').first()
                           
                            # Add the item to the list of picked items
                            picked_items.append({
                                'warehouse': warehouse,
                                'date': None if item['picked_at'] is None else item['picked_at'].date(),
                                'time': None if item['picked_at'] is None else item['picked_at'],
                                'employee_id': employee_id,
                                'transaction_type': 'Picking',
                                'sku_color': item['sku_color'],
                                'location': location['location'] if item['location'] is None else item['location'],
                                'qty_out': item['amount']
                            })

                        except Exception as e:
                            logger.error(f"Failed to fetch information for picklist item with sku_color of {item['sku_color']} (InventoryPickingLogging)")
                
                # Sort the list of picklist items by date annd time in descending order
                picked_items = sorted(picked_items, key=lambda x: (x['time'] is not None, x['time']), reverse=True)

                # Return the list of picked items
                logger.info(f"Successfully fetch data for tracking inventory picking activity (InventoryPickingLogging)")
                return Response(picked_items, status=status.HTTP_200_OK)
            
            except InventoryPicklist.DoesNotExist:
                logger.error("Inventory Picklist does not exist")
                return Response(status=status.HTTP_404_NOT_FOUND)
            
            except InventoryPicklistItem.DoesNotExist:
                logger.error("Inventory Picklist Item does not exist")
                return Response(status=status.HTTP_404_NOT_FOUND)
            
            except Exception as e:
                logger.error("Failed to fetch data for the picklist %s (InventoryPickingLogging)", id)
                return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error("Failed to fetch the data for tracking inventory picking activity (InventoryPickingLogging)")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)