from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from .models import DetectionSession, EmotionResult
from .utils import process_image_emotion, process_webcam_frame
from .forms import ImageUploadForm
import json
import uuid
import os

def index(request):
    """Homepage with navigation options"""
    recent_sessions = DetectionSession.objects.all().order_by('-created_at')[:5]
    return render(request, 'index.html', {'recent_sessions': recent_sessions})

def upload_image(request):
    """Handle image upload and emotion detection"""
    if request.method == 'POST':
        form = ImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = request.FILES['image']
            
            # Create session
            session = DetectionSession.objects.create(
                detection_type='image'
            )
            
            # Save uploaded file
            fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'uploads/images'))
            filename = fs.save(uploaded_file.name, uploaded_file)
            file_path = fs.path(filename)
            
            # Process emotion detection
            results = process_image_emotion(file_path)
            
            # Save results to database
            for result in results:
                EmotionResult.objects.create(
                    session=session,
                    image_path=file_path,
                    emotions=result['emotions'],
                    face_coordinates=result['coordinates'],
                    dominant_emotion=result['dominant_emotion'],
                    confidence_score=max(result['emotions'].values())
                )
            
            return redirect('detector:results', session_id=session.session_id)
    else:
        form = ImageUploadForm()
    
    return render(request, 'upload.html', {'form': form})

def webcam_detection(request):
    """Real-time webcam emotion detection"""
    return render(request, 'webcam.html')

@csrf_exempt
def process_webcam_frame(request):
    """API endpoint for webcam frame processing"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            frame_data = data.get('frame')
            
            if frame_data:
                results = process_webcam_frame(frame_data)
                return JsonResponse({
                    'success': True,
                    'faces': results,
                    'count': len(results)
                })
            else:
                return JsonResponse({'success': False, 'error': 'No frame data'})
                
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def detection_results(request, session_id):
    """Display detection results"""
    session = get_object_or_404(DetectionSession, session_id=session_id)
    results = EmotionResult.objects.filter(session=session)
    
    return render(request, 'results.html', {
        'session': session,
        'results': results
    })

def detection_history(request):
    """View past detection sessions"""
    sessions = DetectionSession.objects.all().order_by('-created_at')
    return render(request, 'history.html', {'sessions': sessions})
