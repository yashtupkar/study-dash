import React, { useState, useEffect, useRef } from 'react';
import { Camera, RotateCw, X, Check, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CameraCaptureModal({ isOpen, onClose, onCapture, isUploading }) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check if the device has multiple cameras (e.g. front and back)
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length > 1) {
          setHasMultipleCameras(true);
        }
      })
      .catch(err => console.error("Error enumerating devices:", err));
  }, []);

  // Handle camera stream setup/cleanup
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    
    // Stop any existing stream tracks first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera getUserMedia error:", err);
      // Fallback without width/height constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Camera fallback error:", fallbackErr);
        setError("Could not access camera. Please ensure permissions are granted and no other application is using it.");
        toast.error("Camera access failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match the actual video stream details
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas content to data URL (JPEG format)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;
    
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `study-doc-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    } catch (err) {
      console.error("Error creating file from capture:", err);
      toast.error("Failed to process captured image.");
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-[85vh] max-h-[700px]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h3 className="font-bold font-outfit text-sm text-zinc-100 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <span>Document Scanner</span>
          </h3>
          <button 
            disabled={isUploading}
            onClick={handleClose} 
            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="text-zinc-300 text-xs font-semibold">{error}</p>
              <button 
                onClick={startCamera}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all shadow-md"
              >
                Retry Camera Connection
              </button>
            </div>
          ) : capturedImage ? (
            /* Image Preview */
            <div className="w-full h-full flex items-center justify-center p-2">
              <img 
                src={capturedImage} 
                alt="Captured document" 
                className="max-w-full max-h-full object-contain rounded-lg border border-zinc-800"
              />
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="w-full h-full relative flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Initializing lens...</span>
                </div>
              )}
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />

              {/* Grid Scanning Overlay */}
              {!loading && (
                <div className="absolute inset-8 border-2 border-dashed border-primary/40 rounded-xl pointer-events-none flex flex-col justify-between p-4 bg-primary/5">
                  <div className="flex justify-between w-full">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl"></div>
                    <div className="w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr"></div>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-primary/80 uppercase tracking-wider bg-black/75 px-2.5 py-1 rounded-md border border-primary/20">
                      Align document page inside frame
                    </span>
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl"></div>
                    <div className="w-4 h-4 border-b-2 border-r-2 border-primary rounded-br"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for Drawing Captures */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer / Control Bar */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 text-zinc-400 py-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Uploading Capture...</span>
            </div>
          ) : capturedImage ? (
            /* Capture Confirmation View */
            <div className="flex gap-4 w-full max-w-xs">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2 px-3 border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2 px-3 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Use & Upload</span>
              </button>
            </div>
          ) : (
            /* Live Camera Capture Controls */
            <div className="flex items-center justify-between w-full max-w-sm px-6">
              
              {/* Left Spacer or grid button */}
              <div className="w-10"></div>

              {/* Shutter Button */}
              <button
                type="button"
                disabled={loading || error}
                onClick={handleCapture}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 bg-transparent disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-white hover:bg-zinc-100 transition-colors" />
              </button>

              {/* Flip Camera Button */}
              {hasMultipleCameras ? (
                <button
                  type="button"
                  onClick={toggleCamera}
                  disabled={loading || error}
                  className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition-all disabled:opacity-50"
                  title="Switch Camera"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10"></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
