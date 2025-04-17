from django.urls import path
from django.conf import settings
from .views import get_all_recommendation,create_recommendation
from django.conf.urls.static import static


urlpatterns = [
    path('recommend/create',create_recommendation,name="create_recommendation"),
    path('recommend/',get_all_recommendation,name="get_all_recommendation")
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)