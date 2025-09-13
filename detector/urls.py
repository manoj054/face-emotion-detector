from django.urls import path
from . import views

app_name = 'detector'

urlpatterns = [
    path('', views.index, name='index'),
    path('webcam/', views.webcam, name='webcam'),
    path('analyze-frame/', views.analyze_webcam_frame, name='analyze_webcam_frame'),
    path('upload/', views.upload, name='upload'),
    path('history/', views.history, name='history'),
    path('results/<str:session_id>/', views.results, name='results'),
]
