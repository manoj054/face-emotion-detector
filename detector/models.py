from django.db import models
import uuid

class DetectionSession(models.Model):
    DETECTION_TYPES = [
        ('image', 'Image Upload'),
        ('webcam', 'Webcam'),
        ('video', 'Video File')
    ]
    
    session_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    detection_type = models.CharField(max_length=20, choices=DETECTION_TYPES)
    
    def __str__(self):
        return f"Session {self.session_id} - {self.detection_type}"

class EmotionResult(models.Model):
    session = models.ForeignKey(DetectionSession, on_delete=models.CASCADE)
    image_path = models.CharField(max_length=255)
    emotions = models.JSONField()
    face_coordinates = models.JSONField()
    dominant_emotion = models.CharField(max_length=50)
    confidence_score = models.FloatField()
    processed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Result for {self.session.session_id} - {self.dominant_emotion}"
