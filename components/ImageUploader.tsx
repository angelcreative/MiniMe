import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types';
import { CameraCapture } from './CameraCapture';
import { compressForStorage } from '../services/draftStorage';
import { tryConvertHeicToJpeg, validateParentPhoto } from '../services/imageFormats';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, UploadSimple, X } from '@phosphor-icons/react';
import { Button } from './Button';

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
  const { t } = useLanguage();
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
        setFormatError(t.heicError);
        return;
      }
      setFormatError(
        /too large/i.test(validated.error) ? t.fileTooLarge : t.unsupportedFormat
      );
      return;
    }

    const mimeType = validated.mimeType;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      void emitImage(file, result, mimeType);
    };
    reader.onerror = () => {
      setFormatError(t.readPhotoFail);
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
      <div className="flex flex-col gap-2 p-4 rounded-container bg-surface shadow-sm">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/jpg,image/pjpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif"
          onChange={handleFileChange}
        />

        <div className="relative aspect-square rounded-inner overflow-hidden bg-subtle">
          {image ? (
            <>
              <img
                src={image.previewUrl}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover enter"
              />
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  setFormatError(null);
                }}
                aria-label={`${t.remove} · ${label}`}
                className="ctl touch absolute top-2 right-2 z-raised w-control h-control rounded-full bg-surface text-text shadow-sm flex items-center justify-center"
              >
                <X size={16} weight="bold" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={triggerFileUpload}
              className="ctl absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-muted text-center"
            >
              {icon}
              <span className="hidden sm:block text-small max-w-[22ch]">{subLabel}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <p className="text-label font-medium text-text truncate" title={label}>
            {label}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={triggerFileUpload}
              aria-label={`${image ? t.replace : t.upload} · ${label}`}
            >
              <UploadSimple size={16} weight="duotone" />
              {image ? t.replace : t.upload}
            </Button>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              aria-label={`${t.camera} · ${label}`}
              title={t.camera}
              className="ctl touch w-control h-control rounded-full bg-bg text-text border border-control-border flex items-center justify-center"
            >
              <Camera size={16} weight="duotone" />
            </button>
          </div>
        </div>

        {formatError && (
          <p role="alert" className="text-small text-error-text bg-error-bg rounded-inner px-4 py-2">
            {formatError}
          </p>
        )}
      </div>

      {showCamera && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}
    </>
  );
};
