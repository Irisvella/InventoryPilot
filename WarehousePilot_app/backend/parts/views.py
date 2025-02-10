from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Part

class VerifyBarcode(APIView):
    def post(self, request, format=None):
        barcode = request.data.get("barcode")  # Retrieve barcode from the request

        if not barcode:
            return Response({"error": "Barcode is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Find the part by the barcode
            part = Part.objects.get(barcode=barcode)

            # Return the part's details if found
            return Response({
                "message": "Barcode verified successfully",
                "sku": part.sku_color,
                "description": part.description
            }, status=status.HTTP_200_OK)

        except Part.DoesNotExist:
            # If part doesn't exist, return an error
            return Response({"error": "Part not found for this barcode"}, status=status.HTTP_404_NOT_FOUND)
