from django.urls import path
from .views import get_all_recommendation,create_recommendation

urlpatterns = [
    path('recommend/create',create_recommendation,name="create_recommendation"),
    path('recommend/',get_all_recommendation,name="get_all_recommendation")
]