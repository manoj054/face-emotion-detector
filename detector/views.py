import json
import base64
import cv2
import numpy as np
import uuid
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from deepface import DeepFace
from django.utils import timezone
import io
from PIL import Image
from .models import DetectionSession, DetectionResult

def index(request):
    """Homepage view"""
    try:
        recent_sessions = DetectionSession.objects.order_by('-created_at')[:5]
    except:
        recent_sessions = []
    
    return render(request, 'index.html', {
        'recent_sessions': recent_sessions
    })

def webcam(request):
    """Render the webcam page"""
    return render(request, 'webcam.html')

@csrf_exempt
def analyze_webcam_frame(request):
    """Process webcam frame and return emotion results"""
    if request.method == 'POST':
        try:
            # Get base64 image data from JavaScript
            image_data = request.POST.get('image_data')
            
            if not image_data:
                return JsonResponse({
                    'success': False,
                    'error': 'No image data received',
                    'face_detected': False
                })
            
            # Remove the data URL prefix
            image_data = image_data.split(',')[1]
            
            # Decode base64 to image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert PIL image to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Analyze emotion using DeepFace
            result = DeepFace.analyze(
                opencv_image, 
                actions=['emotion'], 
                enforce_detection=False
            )
            
            if isinstance(result, list):
                result = result[0]
            
            # Extract emotion data
            dominant_emotion = result['dominant_emotion']
            emotion_scores = result['emotion']
            
            # Format confidence scores
            formatted_emotions = {
                emotion: round(score, 2) 
                for emotion, score in emotion_scores.items()
            }
            
            # Save to database (optional)
            try:
                session = DetectionSession.objects.create(
                    session_id=str(uuid.uuid4()),
                    detection_type='webcam'
                )
                
                DetectionResult.objects.create(
                    session=session,
                    dominant_emotion=dominant_emotion,
                    emotion_scores=formatted_emotions
                )
            except:
                pass  # Continue even if database save fails
            
            return JsonResponse({
                'success': True,
                'dominant_emotion': dominant_emotion,
                'all_emotions': formatted_emotions,
                'face_detected': True
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e),
                'face_detected': False,
                'message': 'Could not detect faces. Please ensure good lighting and look directly at the camera.'
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def upload(request):
    """Upload image view"""
    return render(request, 'upload.html')

def history(request):
    """History view"""
    try:
        sessions = DetectionSession.objects.order_by('-created_at')
    except:
        sessions = []
    
    return render(request, 'history.html', {
        'sessions': sessions
    })

def results(request, session_id):
    """Results view"""
    try:
        session = get_object_or_404(DetectionSession, session_id=session_id)
        results = DetectionResult.objects.filter(session=session)
    except:
        session = None
        results = []
    
    return render(request, 'results.html', {
        'session': session,
        'results': results
    })
