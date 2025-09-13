from django.contrib import admin
from .models import DetectionSession, DetectionResult

@admin.register(DetectionSession)
class DetectionSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'detection_type', 'created_at')
    list_filter = ('detection_type', 'created_at')
    search_fields = ('session_id',)
    readonly_fields = ('session_id', 'created_at')

@admin.register(DetectionResult)
class DetectionResultAdmin(admin.ModelAdmin):
    list_display = ('session', 'dominant_emotion', 'created_at')
    list_filter = ('dominant_emotion', 'created_at')
    search_fields = ('session__session_id', 'dominant_emotion')
    readonly_fields = ('created_at',)
