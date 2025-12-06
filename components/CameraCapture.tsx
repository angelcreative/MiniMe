import React, { useRef, useEffect, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check for multiple cameras available
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.warn("Unable to enumerate devices:", e);
      }
    };
    checkCameras();
  }, []);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      // Stop any existing stream tracks before starting a new one
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError('');
      } catch (err) {
        console.error("Camera access error:", err);
        setError('Unable to access camera. Please ensure permissions are granted and no other app is using it.');
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]); 

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // We want a square capture centered on the video feed
    // This matches the square UI viewport the user sees
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror the image only if using front camera
      if (facingMode === 'user') {
        // To mirror a cropped selection, we need to be careful with transforms
        // Translate to the right edge of the canvas width
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      // Draw the centered square crop
      ctx.drawImage(
        video, 
        startX, startY, size, size, // Source: x, y, w, h
        0, 0, size, size            // Dest: x, y, w, h
      );
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-white shrink-0 z-20 relative border-b border-slate-100">
          <h3 className="text-slate-800 font-bold text-lg">Take a Selfie</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 bg-slate-50 flex flex-col items-center justify-center min-h-[300px] p-6">
          {error ? (
            <div className="text-red-500 text-center p-6 max-w-xs bg-red-50 rounded-xl">
              <p className="mb-4 font-medium">{error}</p>
              <button onClick={onClose} className="px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 text-sm hover:bg-red-50">Close</button>
            </div>
          ) : (
            <>
              {/* Viewfinder Container: Enforce Square Aspect Ratio */}
              <div className="relative w-full max-w-[340px] aspect-square rounded-[2rem] overflow-hidden shadow-xl ring-4 ring-white">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`} 
                />
                
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                   {/* Oval Guide with Dark Mask */}
                   <div 
                     className="w-[65%] h-[80%] rounded-[50%] border-2 border-white/60 border-dashed shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"
                   ></div>
                </div>

                {/* Instruction Text (Floating above overlay) */}
                <div className="absolute top-6 inset-x-0 z-30 flex justify-center pointer-events-none">
                  <span className="px-4 py-2 bg-white/90 text-indigo-900 text-xs font-bold rounded-full backdrop-blur-md shadow-lg">
                    Position your face in the oval
                  </span>
                </div>
              </div>
              
              {/* Switch Camera Button (Below Viewfinder) */}
              {hasMultipleCameras && (
                <button 
                  onClick={switchCamera}
                  className="absolute bottom-8 right-8 z-20 p-3 rounded-full bg-white text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                  title="Switch Camera"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 2.025.75 3.876 2 5.334"/>
                    <path d="M4 14c0 4.418 3.582 8 8 8s8-3.582 8-8c0-2.025-.75-3.876-2-5.334"/>
                    <path d="M12 2v4"/>
                    <path d="M12 18v4"/>
                    <path d="M2 12h4"/>
                    <path d="M18 12h4"/>
                    <path d="M20 10l-2.5-2.5"/>
                    <path d="M4 14l2.5 2.5"/>
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex justify-center bg-white border-t border-slate-100 shrink-0 relative z-20">
          <button 
            onClick={handleCapture}
            disabled={!!error}
            className="group relative h-18 w-18 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Capture button styling */}
            <div className="absolute inset-0 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors duration-300 w-20 h-20 -m-1"></div>
            <div className="relative h-16 w-16 rounded-full bg-white border-4 border-indigo-500 shadow-sm" />
          </button>
        </div>

      </div>
    </div>
  );
};