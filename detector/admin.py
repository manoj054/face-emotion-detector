from django.contrib import admin
from .models import DetectionSession, EmotionResult

@admin.register(DetectionSession)
class DetectionSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'detection_type', 'created_at']
    list_filter = ['detection_type', 'created_at']
    search_fields = ['session_id']

@admin.register(EmotionResult)
class EmotionResultAdmin(admin.ModelAdmin):
    list_display = ['session', 'dominant_emotion', 'confidence_score', 'processed_at']
    list_filter = ['dominant_emotion', 'processed_at']
    search_fields = ['session__session_id']
