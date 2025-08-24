import cv2
from deepface import DeepFace
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import os

def detect_faces(image):
    """Detect faces using OpenCV Haar Cascade"""
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        return faces
    except Exception as e:
        print(f"Face detection error: {e}")
        return []

def analyze_emotion(face_image):
    """Analyze emotion using DeepFace"""
    try:
        result = DeepFace.analyze(face_image, actions=['emotion'], enforce_detection=False)
        if isinstance(result, list):
            return result[0]['emotion']
        else:
            return result['emotion']
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        return {
            'angry': 0.0, 'disgust': 0.0, 'fear': 0.0, 'happy': 0.0,
            'sad': 0.0, 'surprise': 0.0, 'neutral': 100.0
        }

def process_image_emotion(image_path):
    """Complete image emotion processing pipeline"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return []
            
        faces = detect_faces(image)
        results = []
        
        for (x, y, w, h) in faces:
            # Extract face region
            face = image[y:y+h, x:x+w]
            
            # Analyze emotion
            emotions = analyze_emotion(face)
            dominant_emotion = max(emotions, key=emotions.get)
            
            results.append({
                'coordinates': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'emotions': emotions,
                'dominant_emotion': dominant_emotion
            })
        
        return results
    except Exception as e:
        print(f"Image processing error: {e}")
        return []

def process_webcam_frame(frame_data):
    """Process single webcam frame"""
    try:
        # Decode base64 frame data
        frame_bytes = base64.b64decode(frame_data.split(',')[1])
        image = Image.open(BytesIO(frame_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Detect faces and emotions
        faces = detect_faces(frame)
        results = []
        
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            emotions = analyze_emotion(face)
            dominant_emotion = max(emotions, key=emotions.get)
            
            results.append({
                'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h),
                'emotions': emotions,
                'dominant_emotion': dominant_emotion,
                'confidence': max(emotions.values())
            })
        
        return results
    except Exception as e:
        print(f"Webcam frame processing error: {e}")
        return []
