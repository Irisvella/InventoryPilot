from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from django.core.files.storage import default_storage
from django.conf import settings
from .models import OAReport 
from  orders.models import Orders, OrderPart
from parts.models import Part
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

class OAInputView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        logger.info("📥 Received a POST request for file upload.")

        if "file" not in request.FILES:
            logger.error("❌ No file uploaded!")
            return Response({"error": "No file uploaded"}, status=400)

        file = request.FILES["file"]
        file_extension = os.path.splitext(file.name)[1].lower()
        file_path = default_storage.save(f"uploads/{file.name}", file)
        logger.info(f"📂 File saved at: {file_path}")

        try:
            logger.info(f"📊 Detecting file type: {file_extension}")

            if file_extension in [".xlsm", ".xlsx"]:
                df = pd.read_excel(file_path, engine="openpyxl")
            elif file_extension == ".csv":
                df = pd.read_csv(file_path)
            else:
                logger.error(f"❌ Unsupported file format: {file_extension}")
                return Response({"error": f"Unsupported file format: {file_extension}"}, status=400)

            logger.info(f"✅ Successfully loaded file. Shape: {df.shape}")

            # Define required columns and rename them
            COLUMN_MAPPING = {
                "275": "material_type",
                "NoCommande": "order_id",
                "QteAProd": "qty",
                "NoProd": "sku_color",
                "Departement": "department",
                "LineUpNo": "lineup_nb",
                "LineupName": "lineup_name",
                "MaxDate": "due_date",
                "NomClientLiv": "client_name",
                "ProjectType": "project_type",
                "LOC": "location",
                "AREA": "area",
                "MODEL FINAL": "final_model",
                "StatutOA": "importance"
            }

            # Check if required columns exist
            missing_columns = [col for col in COLUMN_MAPPING.keys() if col not in df.columns]
            if missing_columns:
                logger.error(f"❌ Missing columns in uploaded file: {missing_columns}")
                return Response({"error": f"Missing columns: {missing_columns}"}, status=400)

            df = df[list(COLUMN_MAPPING.keys())].rename(columns=COLUMN_MAPPING)
            logger.info(f"📋 Columns after renaming: {list(df.columns)}")

            # ✅ Insert Orders into `Orders` Table
            unique_orders = df[['order_id', 'due_date', 'client_name', 'project_type']].drop_duplicates()
            new_orders = []

            for _, order in unique_orders.iterrows():
                # Check if order exists before inserting
                if not Orders.objects.filter(order_id=order['order_id']).exists():
                    new_orders.append(Orders(
                        order_id=order['order_id'],
                        due_date=order['due_date'],
                        customer_name=order['client_name'],
                        project_type=order['project_type'],
                        status="Not Started"  # Default status
                    ))

            if new_orders:
                Orders.objects.bulk_create(new_orders)
                logger.info(f"✅ Inserted {len(new_orders)} new orders.")

            # Insert Parts into `OrderPart` Table
            new_parts = []

            for _, row in df.iterrows():
                order = Orders.objects.get(order_id=row['order_id'])  # Get the order object
                
                normalized_sku = row["sku_color"].strip().upper()  # Normalize SKU
                try:
                    part = Part.objects.get(sku_color__iexact=normalized_sku)  # Case-insensitive match
                except Part.DoesNotExist:
                    logger.error(f"❌ Part with SKU '{normalized_sku}' does not exist. Skipping entry.")
                    continue  

                if not OrderPart.objects.filter(order_id=order, sku_color=part, final_model=row["final_model"]).exists():
                    new_parts.append(OrderPart(
                        order_id=order,
                        sku_color=part,  
                        qty=row["qty"],
                        location=row["location"],
                        area=row["area"],
                        final_model=row["final_model"],
                        material_type=row["material_type"],
                        department=row["department"],
                        lineup_nb=row["lineup_nb"],
                        lineup_name=row["lineup_name"],
                        status=False,  # Default status
                        importance=row["importance"]
                    ))
                else:
                    logger.info(f"⚠️ OrderPart with order_id {order.order_id} and SKU {part.sku_color} already exists. Skipping entry.")

            if new_parts:
                OrderPart.objects.bulk_create(new_parts)
                logger.info(f"✅ Inserted {len(new_parts)} order parts.")

            # ✅ Delete the uploaded file after processing
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Deleted uploaded file: {file_path}")

            return Response({
                "message": f"File processed. {len(new_orders)} new orders and {len(new_parts)} parts inserted."
            }, status=201)

        except Exception as e:
            logger.error(f"❌ Error processing file: {e}")

            # ✅ Delete file if an error occurs
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Deleted uploaded file due to error: {file_path}")

            return Response({"error": str(e)}, status=400)
