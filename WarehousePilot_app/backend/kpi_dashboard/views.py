from datetime import timedelta
from django.http import JsonResponse
from django.db.models import Count
from inventory.models import InventoryPicklistItem
from django.db.models.functions import TruncDay


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
from django.db.models.functions import TruncDay
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
    Each day in the selected period is returned as a separate entry for daily charts.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        logger.debug("Starting order_fulfillment_rate function")

        # Get filter type (default: month) and reference date from query parameters
        filter_type = request.GET.get('filter', 'month').lower()
        reference_date_str = request.GET.get('date', None)

        if reference_date_str:
            try:
                reference_date = datetime.strptime(reference_date_str, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({"error": "Invalid date format, expected YYYY-MM-DD"}, status=400)
        else:
            reference_date = datetime.now()

        # Determine the overall period (start and end) based on filter type
        if filter_type == 'day':
            period_start = reference_date.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=1)
        elif filter_type == 'week':
            # Start on Monday
            period_start = reference_date - timedelta(days=reference_date.weekday())
            period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + timedelta(days=7)
        else:  # Default to month
            period_start = reference_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = period_start + relativedelta(months=1)

        logger.debug(f"Filtering orders from {period_start} to {period_end} for filter '{filter_type}'")

        # Aggregate orders by day within the period
        orders_qs = (
            Orders.objects
            .filter(start_timestamp__gte=period_start, start_timestamp__lt=period_end)
            .annotate(day=TruncDay('start_timestamp'))
            .values('day')
            .annotate(total_orders_started=Count('order_id'))
            .order_by('day')
        )

        # Create a lookup dictionary keyed by the day (date object)
        aggregated_data = { entry['day'].date(): entry for entry in orders_qs }

        data = []
        current_day = period_start.date()
        end_day = period_end.date()

        # Loop through each day in the period
        while current_day < end_day:
            day_start = datetime.combine(current_day, datetime.min.time())
            day_end = day_start + timedelta(days=1)

            # Get orders for this specific day
            day_orders = Orders.objects.filter(start_timestamp__gte=day_start, start_timestamp__lt=day_end)
            order_ids = list(day_orders.values_list('order_id', flat=True))
            orders_started = day_orders.count()
            total_orders_count = Orders.objects.count()

            if not order_ids:
                data.append({
                    "period": day_start.strftime("%Y-%m-%d"),
                    "total_orders_started": aggregated_data.get(current_day, {}).get('total_orders_started', 0),
                    "total_orders_count": total_orders_count,
                    "orders_started": 0,
                    "partially_fulfilled": 0,
                    "fully_fulfilled": 0,
                })
                current_day += timedelta(days=1)
                continue

            # Get parts associated with these orders
            parts = Part.objects.filter(orderpart__order_id__in=order_ids)
            part_skus = list(parts.values_list('sku_color', flat=True))
            if not part_skus:
                data.append({
                    "period": day_start.strftime("%Y-%m-%d"),
                    "total_orders_started": aggregated_data.get(current_day, {}).get('total_orders_started', orders_started),
                    "total_orders_count": total_orders_count,
                    "orders_started": orders_started,
                    "partially_fulfilled": 0,
                    "fully_fulfilled": 0,
                })
                current_day += timedelta(days=1)
                continue

            # Count partially fulfilled orders (orders with at least one ManufacturingTask in progress)
            partially_fulfilled_orders = OrderPart.objects.filter(
                order_id__in=order_ids,
                sku_color__manufacturingtask__status__in=["nesting", "bending", "cutting", "welding", "painting"]
            ).values('order_id').distinct().count()

            # Count fully fulfilled orders (orders where all ManufacturingTasks are completed)
            fully_fulfilled_orders = OrderPart.objects.filter(
                order_id__in=order_ids,
                sku_color__manufacturingtask__status="completed"
            ).values('order_id').distinct().count()

            data.append({
                "period": day_start.strftime("%Y-%m-%d"),
                "total_orders_started": aggregated_data.get(current_day, {}).get('total_orders_started', orders_started),
                "total_orders_count": total_orders_count,
                "orders_started": orders_started,
                "partially_fulfilled": partially_fulfilled_orders,
                "fully_fulfilled": fully_fulfilled_orders,
            })

            logger.debug(f"Added data entry for {current_day}")
            current_day += timedelta(days=1)

        logger.debug(f"Final data count: {len(data)}")
        return JsonResponse(data, safe=False)

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse({"error": str(e), "traceback": traceback.format_exc()}, status=500)
