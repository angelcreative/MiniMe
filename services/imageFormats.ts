/** Canonical parent-photo formats for MiniMe uploads. */

export const ACCEPTED_FORMATS_LABEL = 'JPG, PNG, or WebP';

/** Shown under each parent photo picker. */
export const ACCEPTED_FORMATS_HINT =
  'Accepted: JPG, PNG, or WebP. iPhone HEIC is not supported — export as JPG in Photos.';

/** Raw upload cap before client-side compress (phone photos often 5–12MB). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
]);

const HEIC_MIME = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const HEIC_EXT = new Set(['.heic', '.heif']);

export const HEIC_ERROR =
  'iPhone HEIC is not supported — export as JPG in Photos, or turn on “Most Compatible” in Settings → Camera → Formats.';

export const FILE_TOO_LARGE_ERROR =
  'Photo is too large (max 15MB). Try a smaller export or take a new photo.';

export const UNSUPPORTED_FORMAT_ERROR =
  'Unsupported format. Please upload a JPG, PNG, or WebP photo.';

export function extensionOf(filename: string): string {
  const m = /\.[^.]+$/.exec(String(filename || '').toLowerCase());
  return m ? m[0] : '';
}

export function isHeicFile(file: File): boolean {
  const mime = String(file.type || '').toLowerCase().trim();
  const ext = extensionOf(file.name);
  return HEIC_MIME.has(mime) || HEIC_EXT.has(ext);
}

/** Prefer MIME; fall back to extension (phones often send empty/wrong MIME). */
export function resolveAcceptedMime(file: File): string | null {
  const mime = String(file.type || '').toLowerCase().trim();
  if (ACCEPTED_MIME.has(mime)) {
    if (mime === 'image/jpg' || mime === 'image/pjpeg') return 'image/jpeg';
    return mime;
  }
  const ext = extensionOf(file.name);
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return null;
}

export type ValidateResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string; heic: boolean };

export function validateParentPhoto(file: File): ValidateResult {
  // Flag HEIC first so iPhone users get an actionable message (not a generic reject).
  if (isHeicFile(file)) {
    return { ok: false, error: HEIC_ERROR, heic: true };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: FILE_TOO_LARGE_ERROR, heic: false };
  }
  const mimeType = resolveAcceptedMime(file);
  if (!mimeType) {
    return { ok: false, error: UNSUPPORTED_FORMAT_ERROR, heic: false };
  }
  return { ok: true, mimeType };
}

/**
 * Best-effort HEIC→JPEG when the browser can already decode the file
 * (e.g. some Safari builds). Returns null if decode fails — caller should
 * show HEIC_ERROR. No heavy HEIC libraries.
 */
export async function tryConvertHeicToJpeg(file: File): Promise<{
  dataUrl: string;
  mimeType: 'image/jpeg';
} | null> {
  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('heic decode failed'));
        el.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, img.naturalWidth || img.width);
      canvas.height = Math.max(1, img.naturalHeight || img.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      if (!dataUrl.startsWith('data:image/jpeg')) return null;
      return { dataUrl, mimeType: 'image/jpeg' };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}
