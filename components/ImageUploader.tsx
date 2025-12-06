import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types';
import { CameraCapture } from './CameraCapture';

interface ImageUploaderProps {
  label: string;
  subLabel: string;
  image: UploadedImage | null;
  onImageUpload: (img: UploadedImage) => void;
  onRemove: () => void;
  icon: React.ReactNode;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel, 
  image, 
  onImageUpload, 
  onRemove,
  icon 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageUpload({
        file,
        previewUrl: result,
        base64: result,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = async (base64: string) => {
    // Convert base64 to blob/file
    const res = await fetch(base64);
    const blob = await res.blob();
    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
    
    onImageUpload({
      file,
      previewUrl: base64,
      base64: base64,
      mimeType: "image/jpeg"
    });
    setShowCamera(false);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        {/* Upload Area */}
        <div 
          className={`
            relative w-full aspect-square md:aspect-[4/3] rounded-3xl
            border-2 border-dashed transition-all duration-300 shadow-sm
            ${image ? 'border-transparent shadow-md' : 'border-indigo-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'}
            flex flex-col items-center justify-center p-6 group overflow-hidden
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />

          {image ? (
            <>
              <img 
                src={image.previewUrl} 
                alt={label} 
                className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-3 right-3 bg-white/80 hover:bg-white text-rose-500 rounded-full p-2 transition-colors shadow-sm z-10 backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 w-full z-10">
              <div className="text-indigo-200 transition-transform duration-300 group-hover:scale-110 group-hover:text-indigo-300">
                {icon}
              </div>
              
              <div className="space-y-1">
                <p className="text-slate-700 font-bold text-base">{label}</p>
                <p className="text-slate-400 text-xs font-medium">{subLabel}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 pt-2">
                <button
                  onClick={triggerFileUpload}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload
                </button>
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Camera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </>
  );
};