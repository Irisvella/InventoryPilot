from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Part

class VerifyBarcode(APIView):
    """
    API endpoint for handling barcode verification and CRUD operations for Part objects.
    """

    def get(self, request, format=None):
        """
        Retrieve all parts or a specific part using a barcode query parameter.
        Example: GET /api/verify-barcode/?barcode=123456
        """
        barcode = request.query_params.get("barcode", None)

        if barcode:
            try:
                part = Part.objects.get(barcode=barcode)
                return Response({
                    "barcode": part.barcode,
                    "sku": part.sku_color,
                    "description": part.description
                }, status=status.HTTP_200_OK)
            except Part.DoesNotExist:
                return Response({"error": "Part not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)

        # Return all parts if no specific barcode is provided
        parts = Part.objects.all()
        parts_data = [
            {
                "barcode": part.barcode,
                "sku": part.sku_color,
                "description": part.description
            }
            for part in parts
        ]
        return Response(parts_data, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        """
        Verify a barcode and return the corresponding part details.
        """
        barcode = request.data.get("barcode")

        if not barcode:
            return Response({"error": "Barcode is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            part = Part.objects.get(barcode=barcode)
            return Response({
                "message": "Barcode verified successfully",
                "barcode": part.barcode,
                "sku": part.sku_color,
                "description": part.description
            }, status=status.HTTP_200_OK)
        except Part.DoesNotExist:
            return Response({"error": "Part not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, format=None):
        """
        Update an existing part's details based on the barcode.
        """
        barcode = request.data.get("barcode")

        if not barcode:
            return Response({"error": "Barcode is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            part = Part.objects.get(barcode=barcode)
            part.sku_color = request.data.get("sku", part.sku_color)
            part.description = request.data.get("description", part.description)
            part.save()

            return Response({
                "message": "Part updated successfully",
                "barcode": part.barcode,
                "sku": part.sku_color,
                "description": part.description
            }, status=status.HTTP_200_OK)

        except Part.DoesNotExist:
            return Response({"error": "Part not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, format=None):
        """
        Delete a part using the barcode.
        """
        barcode = request.query_params.get("barcode")

        if not barcode:
            return Response({"error": "Barcode is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            part = Part.objects.get(barcode=barcode)
            part.delete()
            return Response({"message": "Part deleted successfully"}, status=status.HTTP_200_OK)
        except Part.DoesNotExist:
            return Response({"error": "Part not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)
