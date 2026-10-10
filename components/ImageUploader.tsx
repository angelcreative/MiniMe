import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types';
import { CameraCapture } from './CameraCapture';
import { compressForStorage } from '../services/draftStorage';
import {
  ACCEPTED_FORMATS_HINT,
  HEIC_ERROR,
  tryConvertHeicToJpeg,
  validateParentPhoto,
} from '../services/imageFormats';

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
  const [formatError, setFormatError] = useState<string | null>(null);

  const emitImage = async (
    file: File,
    dataUrl: string,
    mimeType: string
  ) => {
    const compressed = await compressForStorage(dataUrl, mimeType);
    onImageUpload({
      file,
      previewUrl: compressed.base64,
      base64: compressed.base64,
      mimeType: compressed.mimeType,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file after an error.
    e.target.value = '';
    if (!file) return;

    setFormatError(null);

    const validated = validateParentPhoto(file);

    if (validated.ok === false) {
      if (validated.heic) {
        // Best-effort: some browsers (Safari) can decode HEIC via <img>/canvas.
        const converted = await tryConvertHeicToJpeg(file);
        if (converted) {
          const jpegBlob = await (await fetch(converted.dataUrl)).blob();
          const jpegFile = new File(
            [jpegBlob],
            file.name.replace(/\.(heic|heif)$/i, '.jpg') || 'iphone-photo.jpg',
            { type: 'image/jpeg' }
          );
          await emitImage(jpegFile, converted.dataUrl, converted.mimeType);
          return;
        }
        setFormatError(HEIC_ERROR);
        return;
      }
      setFormatError(validated.error);
      return;
    }

    const mimeType = validated.mimeType;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      void emitImage(file, result, mimeType);
    };
    reader.onerror = () => {
      setFormatError('Could not read that photo. Try JPG, PNG, or WebP.');
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = async (base64: string) => {
    setFormatError(null);
    const res = await fetch(base64);
    const blob = await res.blob();
    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
    await emitImage(file, base64, "image/jpeg");
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
            accept="image/jpeg,image/jpg,image/pjpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif" 
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
                  setFormatError(null);
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

        <p className="mt-2 text-center text-[11px] text-slate-400 font-medium leading-snug px-2">
          {ACCEPTED_FORMATS_HINT}
        </p>
        {formatError && (
          <p
            role="alert"
            className="mt-2 text-center text-xs text-rose-500 font-medium bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 leading-snug"
          >
            {formatError}
          </p>
        )}
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
