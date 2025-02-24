from rest_framework import serializers
from .models import recommendation_request

class recommendationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = recommendation_request
        fields = '__all__'
    