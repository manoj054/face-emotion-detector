from django.urls import path
from . import views

app_name = 'detector'

urlpatterns = [
    path('', views.index, name='index'),
    path('upload/', views.upload_image, name='upload'),
    path('webcam/', views.webcam_detection, name='webcam'),
    path('process-frame/', views.process_webcam_frame, name='process_frame'),
    path('results/<str:session_id>/', views.detection_results, name='results'),
    path('history/', views.detection_history, name='history'),
]
