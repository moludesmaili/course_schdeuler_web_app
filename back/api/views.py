from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import recommendation_request
from .serializer import recommendationRequestSerializer
from .engine.scheduler import calculate
import json
import os

def load_json(filename):
    with open(filename, 'r') as f:
        return json.load(f)
    
@api_view(['GET'])
def get_all_recommendation(request):
    recommendations = recommendation_request.objects.all()
    serializers = recommendationRequestSerializer(recommendations,many=True)
    return Response(serializers.data)

@api_view(['POST'])
def create_recommendation(request):
    serializer = recommendationRequestSerializer(data=request.data)
    if serializer.is_valid():
        semester = serializer.data["semester"]
        #taken_courses = serializer.data["taken_courses"]["value"]
        taken_courses = serializer.data["taken_courses"]
        # Parse taken_courses if it's a string or nested JSON
        #failed_courses = serializer.data["failed_courses"]["values"]
        dependencies = load_json('api/engine/course_dep.json')
        # Validate taken courses
        invalid_courses = []
        for course in taken_courses:
            prereqs = [prereq for prereq, data in dependencies.items() if course in data["dependents"]]
            if not all(prereq in taken_courses for prereq in prereqs):
                invalid_courses.append(course)

        if invalid_courses:
            return Response(
                {"error": f"The following courses are invalid because their prerequisites are not taken: {', '.join(invalid_courses)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        goal_schedule = load_json('api/engine/goal.json')
        new_schedule = calculate(str(semester),taken_courses,dependencies,goal_schedule)
        # serializer.save()
        return Response(new_schedule, status = status.HTTP_201_CREATED)
    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
