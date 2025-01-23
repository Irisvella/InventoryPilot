# This file defines authentication and user management endpoints.

# LoginView: Handles user authentication and returns JWT tokens.
# ChangePasswordView: Allows authenticated users to update their password.
# ProfileView: Retrieves profile details of the currently authenticated user.
# RetrieveUsers: Fetches a list of all users from the database.

from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework import status
from django.contrib.auth.hashers import check_password
from .models import users
from django.contrib.auth import update_session_auth_hash
from .serializers import StaffSerializer

# This is the view for the login endpoint
class LoginView(APIView):
    permission_classes = []

    def post(self, request):
            username = request.data.get("username")
            password = request.data.get("password")

            print(f"Username: {username}")
            print(f"Password: {password}")

            # Django built-in authentication
            user = authenticate(username=username, password=password)

            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'username': user.username,
                        'role': user.role,
                        'dob': user.dob,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'department': user.department
                    }
                })
            else:
                return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# This is the view for the change password endpoint           
class ChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user) # to keep the user logged in after changing the password

        return Response({"detail": "Password changed successfully"}, status=status.HTTP_200_OK)

# This is the view for the profile endpoint, gets your profile information    
class ProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            print(f"Request user: {user}")  # Debugging
            print(f"User type: {type(user)}")  # Debugging

            user_data = {
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'N/A'),  
                'first_name': getattr(user, 'first_name', 'N/A'),
                'last_name': getattr(user, 'last_name', 'N/A'),
                'department': getattr(user, 'department', 'N/A'),
            }
            return Response(user_data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class RetrieveUsers(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            staffData = users.objects.all()
            serializer = StaffSerializer(staffData, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
