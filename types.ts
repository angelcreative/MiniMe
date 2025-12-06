
export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationState {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
}

export type ParentRole = 'dad' | 'mom';

export type ChildGender = 'boy' | 'girl';
