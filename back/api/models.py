from django.db import models

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
    #failed_courses = models.JSONField() 
    
    def __str__(self):
        return self.name 
    
