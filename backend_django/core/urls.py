from django.urls import path
from .views import UserMeView, RegisterUserView

urlpatterns = [
    path('auth/me/', UserMeView.as_view(), name='user_me'),
    path('auth/register/', RegisterUserView.as_view(), name='user_register'),
]
