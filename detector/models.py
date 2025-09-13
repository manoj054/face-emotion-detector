from django.db import models
import uuid

class DetectionSession(models.Model):
    DETECTION_TYPES = [
        ('webcam', 'Webcam Detection'),
        ('upload', 'Image Upload'),
    ]
    
    session_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    detection_type = models.CharField(max_length=10, choices=DETECTION_TYPES)
    
    def __str__(self):
        return f"Session {self.session_id[:8]} - {self.get_detection_type_display()}"
    
    class Meta:
        ordering = ['-created_at']

class DetectionResult(models.Model):
    session = models.ForeignKey(DetectionSession, on_delete=models.CASCADE, related_name='results')
    dominant_emotion = models.CharField(max_length=20)
    emotion_scores = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.session.session_id[:8]} - {self.dominant_emotion}"
