let video = document.getElementById('webcam');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');
let isWebcamActive = false;
let stream = null;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const captureBtn = document.getElementById('capture-btn');

// Initialize webcam for live photo capture
async function initWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user'  // Use front camera
            } 
        });
        
        video.srcObject = stream;
        isWebcamActive = true;
        
        // Update button states
        startBtn.disabled = true;
        stopBtn.disabled = false;
        captureBtn.disabled = false;
        
        // Show ready message
        document.getElementById('emotion-results').innerHTML = 
            '<div class="alert alert-success"><i class="bi bi-camera-video"></i> <strong>Webcam Active!</strong><br>Position your face in the frame and click "Take Live Photo" to capture and analyze emotions.</div>';
            
    } catch (error) {
        console.error('Webcam error:', error);
        alert('❌ Cannot access webcam. Please:\n• Allow camera permissions\n• Check if camera is being used by another app\n• Refresh the page and try again');
    }
}

// Stop webcam stream
function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
        isWebcamActive = false;
        
        // Update button states
        startBtn.disabled = false;
        stopBtn.disabled = true;
        captureBtn.disabled = true;
        
        // Clear canvas and results
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('emotion-results').innerHTML = 
            '<p class="text-muted"><i class="bi bi-camera-video-off"></i> Webcam stopped. Click "Start Webcam" to begin taking live photos.</p>';
    }
}

// Capture live photo and detect emotions
async function captureLivePhoto() {
    if (!isWebcamActive || !video.videoWidth || !video.videoHeight) {
        alert('⚠️ Please start the webcam first and wait for the video to load.');
        return;
    }
    
    // Show processing message
    document.getElementById('emotion-results').innerHTML = 
        '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2"><i class="bi bi-camera"></i> Capturing live photo and analyzing emotions...</p></div>';
    
    // Flash effect for photo capture
    showFlashEffect();
    
    // Create canvas for capturing the current video frame
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureCtx = captureCanvas.getContext('2d');
    
    // Draw current video frame to capture canvas
    captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Convert captured frame to base64 image data
    const capturedImageData = captureCanvas.toDataURL('image/jpeg', 0.9);
    
    try {
        // Send captured photo to Django backend for emotion detection
        const response = await fetch('/process-frame/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ 
                frame: capturedImageData,
                timestamp: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.faces && data.faces.length > 0) {
            // Draw face detection overlay
            drawFaceDetectionOverlay(data.faces);
            // Display emotion analysis results
            displayEmotionAnalysis(data.faces, capturedImageData);
            // Optional: Save photo locally
            savePhotoLocally(capturedImageData, data.faces.length);
            
        } else {
            // No faces detected
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById('emotion-results').innerHTML = 
                `<div class="alert alert-warning">
                    <h6><i class="bi bi-exclamation-triangle"></i> No Faces Detected</h6>
                    <p>Could not detect any faces in the captured photo. Please:</p>
                    <ul class="mb-3">
                        <li>📍 Position your face clearly in the frame</li>
                        <li>💡 Ensure good lighting on your face</li>
                        <li>📏 Move closer to the camera</li>
                        <li>👀 Look directly at the camera</li>
                    </ul>
                    <button class="btn btn-primary" onclick="captureLivePhoto()">
                        <i class="bi bi-camera"></i> Take Another Photo
                    </button>
                </div>`;
        }
        
    } catch (error) {
        console.error('Emotion detection error:', error);
        document.getElementById('emotion-results').innerHTML = 
            `<div class="alert alert-danger">
                <h6>❌ Detection Error</h6>
                <p>Failed to analyze the captured photo. Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="captureLivePhoto()">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>`;
    }
}

// Show camera flash effect
function showFlashEffect() {
    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'fixed';
    flashDiv.style.top = '0';
    flashDiv.style.left = '0';
    flashDiv.style.width = '100vw';
    flashDiv.style.height = '100vh';
    flashDiv.style.backgroundColor = 'white';
    flashDiv.style.opacity = '0.8';
    flashDiv.style.zIndex = '9999';
    flashDiv.style.pointerEvents = 'none';
    
    document.body.appendChild(flashDiv);
    
    // Play camera shutter sound (optional)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2P1fLNeSsFJHfH8N2QQAoUXrTp66hVFA==');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore audio errors
    
    setTimeout(() => {
        if (flashDiv.parentNode) {
            flashDiv.parentNode.removeChild(flashDiv);
        }
    }, 150);
}

// Draw face detection overlay on video
function drawFaceDetectionOverlay(faces) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    
    faces.forEach((face, index) => {
        const x = face.x * scaleX;
        const y = face.y * scaleY;
        const w = face.w * scaleX;
        const h = face.h * scaleY;
        
        // Draw face bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        // Draw face label background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(x, y - 30, 120, 25);
        
        // Draw face label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Face ${index + 1}`, x + 5, y - 10);
        
        // Draw dominant emotion
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(face.dominant_emotion, x, y + h + 20);
        
        // Draw confidence percentage
        ctx.font = '12px Arial';
        ctx.fillText(`${face.confidence.toFixed(1)}%`, x, y + h + 35);
    });
}

// Display detailed emotion analysis results
function displayEmotionAnalysis(faces, capturedImage) {
    const resultsDiv = document.getElementById('emotion-results');
    
    let html = `
        <div class="alert alert-success">
            <h5><i class="bi bi-camera-fill"></i> Live Photo Captured Successfully!</h5>
            <p class="mb-0">📊 Detected <strong>${faces.length}</strong> face(s) with emotion analysis</p>
            <small class="text-muted">Captured at: ${new Date().toLocaleString()}</small>
        </div>
    `;
    
    faces.forEach((face, index) => {
        // Sort emotions by confidence level
        const sortedEmotions = Object.entries(face.emotions)
            .sort(([,a], [,b]) => b - a);
        
        const topEmotion = sortedEmotions[0];
        const secondEmotion = sortedEmotions[1];
        const thirdEmotion = sortedEmotions[2];
        
        html += `
            <div class="card mb-3 border-success">
                <div class="card-header bg-light">
                    <h6 class="mb-0">
                        <i class="bi bi-person-circle"></i> Face ${index + 1} Analysis
                        <span class="badge bg-success ms-2">${face.dominant_emotion}</span>
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>🎯 Primary Emotion:</h6>
                            <div class="mb-2">
                                <span class="badge bg-primary fs-6">${topEmotion[0]}</span>
                                <div class="progress mt-1" style="height: 8px;">
                                    <div class="progress-bar bg-primary" style="width: ${topEmotion[1]}%"></div>
                                </div>
                                <small class="text-muted">${topEmotion[1].toFixed(1)}% confidence</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>📈 Top Emotions:</h6>
        `;
        
        // Show top 3 emotions
        [topEmotion, secondEmotion, thirdEmotion].forEach(([emotion, value], i) => {
            const colors = ['primary', 'secondary', 'success'];
            html += `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge bg-${colors[i]} me-2">${i + 1}</span>
                    <span class="small">${emotion}:</span>
                    <strong class="small">${value.toFixed(1)}%</strong>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="bi bi-info-circle"></i> 
                            Overall Confidence Score: <strong>${face.confidence.toFixed(1)}%</strong>
                        </small>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <div class="text-center mt-3">
            <button class="btn btn-success me-2" onclick="captureLivePhoto()">
                <i class="bi bi-camera"></i> Take Another Live Photo
            </button>
            <button class="btn btn-info me-2" onclick="downloadPhoto()">
                <i class="bi bi-download"></i> Download Photo
            </button>
            <button class="btn btn-secondary" onclick="clearAnalysis()">
                <i class="bi bi-trash"></i> Clear Results
            </button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    
    // Store captured image for download
    window.lastCapturedImage = capturedImage;
}

// Save photo locally with metadata
function savePhotoLocally(imageData, faceCount) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `live-emotion-photo-${faceCount}faces-${timestamp}.jpg`;
    
    // Store for later download
    window.lastCapturedImage = imageData;
    window.lastCapturedFilename = filename;
}

// Download captured photo
function downloadPhoto() {
    if (window.lastCapturedImage) {
        const link = document.createElement('a');
        link.download = window.lastCapturedFilename || `emotion-photo-${Date.now()}.jpg`;
        link.href = window.lastCapturedImage;
        link.click();
    } else {
        alert('No photo available to download. Capture a photo first.');
    }
}

// Clear analysis results
function clearAnalysis() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('emotion-results').innerHTML = 
        '<div class="alert alert-info"><i class="bi bi-camera-video"></i> Webcam ready! Click "Take Live Photo" to capture and analyze emotions.</div>';
}

// Get CSRF token for Django
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Event listeners
startBtn.addEventListener('click', initWebcam);
stopBtn.addEventListener('click', stopWebcam);
captureBtn.addEventListener('click', captureLivePhoto);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('emotion-results').innerHTML = 
        '<p class="text-muted"><i class="bi bi-camera"></i> Click "Start Webcam" to begin taking live photos for emotion detection.</p>';
});
