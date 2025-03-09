from datetime import timedelta
from django.http import JsonResponse
from django.db.models import Count
from inventory.models import InventoryPicklistItem
from django.db.models.functions import TruncDay
from manufacturingLists.models import ManufacturingTask


def order_picking_accuracy(request):
    if request.method == 'GET':
        accurate_picks = InventoryPicklistItem.objects.filter(status=True).count()
        total_picks = InventoryPicklistItem.objects.count()
        inaccurate_picks = total_picks - accurate_picks

        # Calculate accuracy percentage
        accuracy_percentage = (accurate_picks / total_picks * 100) if total_picks > 0 else 0

        # Define the target accuracy (e.g., 99%)
        target_accuracy = 99

        data = {
            'accurate_picks': accurate_picks,
            'inaccurate_picks': inaccurate_picks,
            'accuracy_percentage': round(accuracy_percentage, 2),  # Round to 2 decimal places
            'target_accuracy': target_accuracy,
        }

        return JsonResponse(data)
    
    
def daily_picks_data(request):
    """
    Returns total picked items per day, based on InventoryPicklistItem.picked_at.
    Only counts items where status=True (meaning it's actually picked).
    """
    if request.method == 'GET':
        picks_by_day_qs = (
            InventoryPicklistItem.objects
            .filter(status=True)
            .annotate(day=TruncDay('picked_at'))   # group by date portion
            .values('day')
            .annotate(picks=Count('picklist_item_id'))
            .order_by('day')
        )

        
        data = []
        for entry in picks_by_day_qs:
            if entry['day']:
                data.append({
                    "day": entry['day'].strftime("%Y-%m-%d"),
                    "picks": entry['picks'],
                })

        return JsonResponse(data, safe=False)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)    
    
    
    
def daily_picks_details(request):
    """
    Returns a breakdown of picked items, grouped by day and order_id.
    
    """
    if request.method == 'GET':
        # Only count items where status=True (actually picked)
        picks_by_day_and_order = (
            InventoryPicklistItem.objects
            .filter(status=True)
            .annotate(day=TruncDay('picked_at'))  
            .values('day', 'picklist_id__order_id')  
            .annotate(picks=Count('picklist_item_id'))
            .order_by('day', 'picklist_id__order_id')
        )

        data = []
        for row in picks_by_day_and_order:
            day_value = row['day']
            order_id = row['picklist_id__order_id']
            picks_count = row['picks']

            data.append({
                "day": day_value.strftime("%Y-%m-%d") if day_value else None,
                "order_id": str(order_id),
                "picks": picks_count
            })

        return JsonResponse(data, safe=False)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)    
    
    
    


from django.http import JsonResponse
from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from orders.models import Orders, OrderPart
from manufacturingLists.models import ManufacturingTask
from inventory.models import Part
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
import logging
import traceback

logger = logging.getLogger(__name__)

def order_fulfillment_rate(request):
    """
    API endpoint to get order fulfillment statistics filtered by date range.
    Supports filtering by 'day', 'week', or 'month'.
    Allows users to specify a custom date for filtering.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        logger.debug("Starting order_fulfillment_rate function")

        # Get filter type (default: monthly)
        filter_type = request.GET.get('filter', 'month').lower()
        reference_date = request.GET.get('date', None)

        if reference_date:
            try:
                reference_date = datetime.strptime(reference_date, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({"error": "Invalid date format, expected YYYY-MM-DD"}, status=400)
        else:
            reference_date = datetime.now()

        # Determine truncation function and period range
        if filter_type == 'day':
            trunc_function = TruncDay('start_timestamp')
            period_start = reference_date.replace(hour=0, minute=0, second=0)
            period_end = reference_date.replace(hour=23, minute=59, second=59)

        elif filter_type == 'week':
            trunc_function = TruncWeek('start_timestamp')
            period_start = reference_date - timedelta(days=reference_date.weekday())  # Start of the week (Monday)
            period_end = period_start + timedelta(days=6, hours=23, minutes=59, seconds=59)  # End of the week (Sunday)

        else:  # Default to 'month'
            trunc_function = TruncMonth('start_timestamp')
            period_start = reference_date.replace(day=1, hour=0, minute=0, second=0)
            period_end = period_start + relativedelta(months=1, seconds=-1)  # Last second of the month

        logger.debug(f"Filtering orders from {period_start} to {period_end}")

        # Get orders started in the selected period
        orders_qs = (
            Orders.objects
            .filter(start_timestamp__gte=period_start, start_timestamp__lte=period_end)
            .annotate(period=trunc_function)
            .values('period')
            .annotate(total_orders_started=Count('order_id'))  # Renamed from total_orders
            .order_by('period')
        )

        logger.debug(f"Orders query returned {len(orders_qs)} periods")

        data = []
        for entry in orders_qs:
            period_date = entry['period']
            if not period_date:
                continue  # Skip invalid periods

            # Orders within this period
            period_orders = Orders.objects.filter(start_timestamp__gte=period_date, start_timestamp__lt=period_end)
            order_ids = list(period_orders.values_list('order_id', flat=True))
            
            # Get orders_started without exclusions
            orders_started = period_orders.count()
            
            # Get ALL orders in the system for total count (regardless of period)
            total_orders_count = Orders.objects.count()

            if not order_ids:
                data.append({
                    "period": period_date.strftime("%Y-%m-%d"),
                    "total_orders_started": entry['total_orders_started'],  # Renamed from total_orders
                    "total_orders_count": total_orders_count,
                    "orders_started": orders_started,  # Now without exclusions
                    "partially_fulfilled": 0,
                    "fully_fulfilled": 0,
                })
                continue

            # Get parts associated with these orders through OrderPart
            parts = Part.objects.filter(orderpart__order_id__in=order_ids)
            part_skus = list(parts.values_list('sku_color', flat=True))

            if not part_skus:
                data.append({
                    "period": period_date.strftime("%Y-%m-%d"),
                    "total_orders_started": entry['total_orders_started'],  # Renamed from total_orders
                    "total_orders_count": total_orders_count,
                    "orders_started": orders_started,  # Now without exclusions
                    "partially_fulfilled": 0,
                    "fully_fulfilled": 0,
                })
                continue

            # Count partially fulfilled orders (Orders that have at least one ManufacturingTask in progress)
            partially_fulfilled_orders = OrderPart.objects.filter(
                order_id__in=order_ids,
                sku_color__manufacturingtask__status__in=["nesting", "bending", "cutting", "welding", "painting"]
            ).values('order_id').distinct().count()

            # Count fully fulfilled orders (Orders where all ManufacturingTasks are completed)
            fully_fulfilled_orders = OrderPart.objects.filter(
                order_id__in=order_ids,
                sku_color__manufacturingtask__status="completed"
            ).values('order_id').distinct().count()

            data.append({
                "period": period_date.strftime("%Y-%m-%d"),
                "total_orders_started": entry['total_orders_started'],  # Renamed from total_orders
                "total_orders_count": total_orders_count,
                "orders_started": orders_started,  # Now without exclusions
                "partially_fulfilled": partially_fulfilled_orders,
                "fully_fulfilled": fully_fulfilled_orders,
            })

            logger.debug(f"Added data entry for {period_date}")

        logger.debug(f"Final data count: {len(data)}")
        return JsonResponse(data, safe=False)

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({"error": str(e), "traceback": traceback.format_exc()}, status=500)


def get_warehouse_throughput(request):
    """
    API endpoint for warehouse throughput KPI.
    Responds to GET request
    Returns the total number of items picked and packed in the warehouse.
    Checks how many items were in pick and pack
    """

    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Get all manufacturing tasks with status 'completed'
    completed_tasks = ManufacturingTask.objects.filter(status="completed")

    # Log completed tasks as list
    logger.info(f"Completed tasks: {list(completed_tasks.values())}")

    # Return completed tasks
    return JsonResponse({"completed_tasks": list(completed_tasks.values())}, safe=False)
