# This file defines user management views for the backend.

# IsAdminUser: Custom permission class allowing access to admin users only.
# ManageUsersView: Retrieves a list of all users on the platform (admin only).
# AddUserView: Adds a new user to the database after validating input.
# EditUserView: Retrieves or updates details of a specific user by user_id.
# DeleteUserView: Deletes a specific user by user_id.

from django.shortcuts import render, HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from auth_app.models import users
from .serializers import StaffSerializer
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

# Create your views here.
def home(request):
    return HttpResponse("Hello, World!")

# IsAdminUser: Allows access to admin users
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'

# Manage Users: Retrieve all of the platform
class ManageUsersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            staffData = users.objects.all()
            serializer = StaffSerializer(staffData, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# Adding Users:  Retrieve user input and add to database
class AddUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Checking if user exists before inserting
            data = request.data
            print(data)
            if users.objects.filter(email=data['email']).exists(): # checks using email - userid instead?
                return Response({"error": "User with this email already exists"}, status=400)
            else:
                print("Creating user")
                user = users.objects.create_user(
                    username=data['username'],
                    password = data['password'],
                    email=data['email'],
                    role=data['role'],
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    department=data['department'],
                    dob = data['dob']

                )
                return Response({"message": "User created successfully"})
              
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        


class EditUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """
        Retrieve details of a specific user by user_id.
        """
        try:
            logger.debug(f"Attempting to fetch user with user_id: {user_id}")
            user = users.objects.get(user_id=user_id)
            logger.debug(f"Found user: {user.username}")
            serializer = StaffSerializer(user)
            return Response(serializer.data, status=200)
        except users.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found")
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            logger.error(f"Error in EditUserView.get: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=500
            )

    def put(self, request, user_id):
        """
        Update details of a specific user by user_id.
        """
        try:
            logger.debug(f"Attempting to update user with user_id: {user_id}")
            user = users.objects.get(user_id=user_id)

            # Deserialize and validate the data
            serializer = StaffSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.debug(f"User {user.username} updated successfully")
                return Response({"message": "User updated successfully"}, status=200)
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=400)
        except users.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found")
            return Response({"error": "User not found"}, status=404)
        except ValidationError as ve:
            logger.error(f"Validation error: {str(ve)}")
            return Response({"error": str(ve)}, status=400)
        except Exception as e:
            logger.error(f"Error in EditUserView.put: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=500
            )
            
            

class DeleteUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        """
        Deletes a user by user_id.
        """
        try:
            user = users.objects.get(user_id=user_id)
            user.delete()
            logger.info(f"User with user_id {user_id} deleted successfully.")
            return Response({"message": "User deleted successfully"}, status=200)
        except users.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found.")
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            logger.error(f"An error occurred while deleting user: {str(e)}")
            return Response({"error": f"An error occurred: {str(e)}"}, status=500)
        
        
        
        