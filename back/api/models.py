from django.db import models

class RecommendationLog(models.Model):
    program           = models.CharField(max_length=100)
    next_semester          = models.CharField(max_length=100)
    taken_courses     = models.JSONField()
    result            = models.JSONField()
    similarity_score  = models.FloatField(
        default=0.0,
        help_text="The similarityScore returned by the scheduler"
    )
    total_credits     = models.IntegerField(
        default=0,
        help_text="The total credits of the generated schedule"
    )
    average_difficulty_score = models.FloatField(
        default=0.0,
        help_text="The average per-semester difficulty score of the generated schedule"
    )
    created_at        = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.program} @ {self.created_at:%Y-%m-%d %H:%M}"

class Course(models.Model):
    name = models.CharField(max_length=200)
    class Meta:
        abstract = True
    def __str__(self):
        return self.name
    
# Create your models here.
class recommendation_request(models.Model):
    program = models.IntegerField()
    taken_courses = models.JSONField()
    next_semester          = models.IntegerField()
    #failed_courses = models.JSONField() 
    
    def __str__(self):
        return self.name 
    
