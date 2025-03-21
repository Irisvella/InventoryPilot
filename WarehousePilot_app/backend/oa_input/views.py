from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from django.core.files.storage import default_storage
from django.conf import settings
from .models import OAReport
import logging
import os

# Set up logging
logger = logging.getLogger(__name__)

class OAInputView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        logger.info("📥 Received a POST request for file upload.")

        if request.method != "POST":
            logger.error(f"❌ Invalid request method: {request.method}")
            return Response({"error": f"Invalid request method: {request.method}"}, status=405)

        if "file" not in request.FILES:
            logger.error("❌ No file uploaded!")
            return Response({"error": "No file uploaded"}, status=400)

        file = request.FILES["file"]
        file_path = default_storage.save(f"uploads/{file.name}", file)
        logger.info(f"📂 File saved at: {file_path}")

        try:
            # Load Excel file
            logger.info("📊 Loading Excel file...")
            df = pd.read_excel(file_path, engine="openpyxl")
            logger.info(f"✅ Successfully loaded Excel file. Shape: {df.shape}")

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
            }

            # Check if required columns exist
            missing_columns = [col for col in COLUMN_MAPPING.keys() if col not in df.columns]
            if missing_columns:
                logger.error(f"❌ Missing columns in uploaded file: {missing_columns}")
                return Response({"error": f"Missing columns: {missing_columns}"}, status=400)

            df = df[list(COLUMN_MAPPING.keys())].rename(columns=COLUMN_MAPPING)
            logger.info(f"📋 Columns after renaming: {list(df.columns)}")

            # Insert each row into the database
            records = [
                OAReport(
                    material_type=row["material_type"],
                    order_id=row["order_id"],
                    qty=row["qty"],
                    sku_color=row["sku_color"],
                    department=row["department"],
                    lineup_nb=row["lineup_nb"],
                    lineup_name=row["lineup_name"],
                    due_date=row["due_date"],
                    client_name=row["client_name"],
                    project_type=row["project_type"],
                    location=row["location"],
                    area=row["area"],
                    final_model=row["final_model"],
                )
                for _, row in df.iterrows()
            ]

            OAReport.objects.bulk_create(records, ignore_conflicts=True)  
            logger.info(f"✅ Successfully inserted {len(records)} rows into database.")

            # ✅ Delete the uploaded file after processing
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Deleted uploaded file: {file_path}")

            return Response({"message": "File processed and uploaded successfully"}, status=201)

        except Exception as e:
            logger.error(f"❌ Error processing file: {e}")

            # ✅ Delete file if an error occurs to avoid unused storage
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"🗑️ Deleted uploaded file due to error: {file_path}")
            return Response({"error": str(e)}, status=400)
