from django.urls import path
from .views import LoginView, ChangePasswordView, ProfileView, RetrieveUsers, ThemePreferenceView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('change_password/', ChangePasswordView.as_view(), name='change_password'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('retrieve_users/', RetrieveUsers.as_view(), name='retrieve_users'),
       path('theme/', ThemePreferenceView.as_view(), name='theme_preference'),

]
