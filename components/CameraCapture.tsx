
import React, { useRef, useEffect, useState } from 'react';
import { ArrowsClockwise, X } from '@phosphor-icons/react';
import { Button } from './Button';
import { useLanguage } from '../i18n/LanguageContext';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
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
        setError('camera');
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.cameraTitle}
      className="fixed inset-0 z-modal flex items-center justify-center p-4 enter"
      style={{ background: 'var(--scrim)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-surface rounded-container shadow-lg p-4 flex flex-col gap-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between gap-2 pl-2">
          <h3 className="font-serif text-lead text-text">{t.cameraTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="ctl touch w-control h-control rounded-full bg-surface text-text flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="flex flex-col gap-4 items-start bg-error-bg text-error-text rounded-inner p-4">
            <p className="text-small">{t.cameraError}</p>
            <Button variant="secondary" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-square rounded-inner overflow-hidden bg-subtle">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[62%] h-[78%] rounded-[50%] border-2 border-white/70 shadow-[0_0_0_1000px_rgba(0,0,0,0.45)]" />
              </div>
              <p className="absolute bottom-4 inset-x-4 text-center text-small text-white">
                {t.cameraHint}
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleCapture}
                aria-label={t.capture}
                className="ctl w-16 h-16 rounded-full bg-primary p-1 flex items-center justify-center"
              >
                <span className="block w-full h-full rounded-full border-2 border-on-primary" />
              </button>
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={switchCamera}
                  aria-label={t.switchCamera}
                  title={t.switchCamera}
                  className="ctl touch absolute right-0 w-control h-control rounded-full bg-bg text-text border border-control-border flex items-center justify-center"
                >
                  <ArrowsClockwise size={16} weight="duotone" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
