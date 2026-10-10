import { ChildGender, UploadedImage } from '../types';

/** Survives Stripe Checkout return (incl. new-tab success_url). */
const PREFIX = 'minime_draft_v1_';
const KEYS = {
  dad: `${PREFIX}dad`,
  mom: `${PREFIX}mom`,
  gender: `${PREFIX}gender`,
  paymentToken: `${PREFIX}paymentToken`,
} as const;

export type StoredImage = {
  base64: string;
  mimeType: string;
};

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

function stores(): Storage[] {
  const list: Storage[] = [];
  try {
    if (typeof localStorage !== 'undefined') list.push(localStorage);
  } catch {
    /* private mode */
  }
  try {
    if (typeof sessionStorage !== 'undefined') list.push(sessionStorage);
  } catch {
    /* ignore */
  }
  return list;
}

function readRaw(key: string): string | null {
  for (const store of stores()) {
    try {
      const v = store.getItem(key);
      if (v) return v;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function writeRaw(key: string, value: string): boolean {
  let ok = false;
  for (const store of stores()) {
    try {
      store.setItem(key, value);
      ok = true;
    } catch {
      /* quota / private mode */
    }
  }
  return ok;
}

function removeRaw(key: string): void {
  for (const store of stores()) {
    try {
      store.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Downscale large camera photos so draft storage fits browser quotas. */
export async function compressForStorage(
  dataUrl: string,
  mimeType: string
): Promise<StoredImage> {
  if (typeof document === 'undefined') {
    return { base64: dataUrl, mimeType };
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image load failed'));
      el.src = dataUrl;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { base64: dataUrl, mimeType };
    ctx.drawImage(img, 0, 0, w, h);
    const normalized = String(mimeType || '').toLowerCase();
    const outMime =
      normalized === 'image/png' || normalized === 'image/webp'
        ? normalized
        : 'image/jpeg';
    const base64 =
      outMime === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        : canvas.toDataURL(outMime);
    return { base64, mimeType: outMime };
  } catch {
    return { base64: dataUrl, mimeType };
  }
}

export function storedToUploaded(stored: StoredImage): UploadedImage {
  const file = new File([], 'restored.jpg', { type: stored.mimeType });
  return {
    file,
    previewUrl: stored.base64,
    base64: stored.base64,
    mimeType: stored.mimeType,
  };
}

function parseStoredImage(raw: string | null): StoredImage | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Support legacy full UploadedImage blobs and slim StoredImage.
    const base64 = parsed?.base64 || parsed?.previewUrl;
    const mimeType = parsed?.mimeType || 'image/jpeg';
    if (typeof base64 === 'string' && base64.startsWith('data:')) {
      return { base64, mimeType };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadDraftDad(): UploadedImage | null {
  const stored =
    parseStoredImage(readRaw(KEYS.dad)) ||
    parseStoredImage(readRaw('dadImage'));
  return stored ? storedToUploaded(stored) : null;
}

export function loadDraftMom(): UploadedImage | null {
  const stored =
    parseStoredImage(readRaw(KEYS.mom)) ||
    parseStoredImage(readRaw('momImage'));
  return stored ? storedToUploaded(stored) : null;
}

export function loadDraftGender(): ChildGender {
  const g = readRaw(KEYS.gender) || readRaw('gender');
  return g === 'boy' ? 'boy' : 'girl';
}

export function loadDraftPaymentToken(): string | null {
  return readRaw(KEYS.paymentToken);
}

export async function saveDraftImage(
  role: 'dad' | 'mom',
  img: UploadedImage | null
): Promise<void> {
  const key = role === 'dad' ? KEYS.dad : KEYS.mom;
  if (!img) {
    removeRaw(key);
    return;
  }
  const slim = await compressForStorage(img.base64, img.mimeType);
  const payload = JSON.stringify(slim);
  if (!writeRaw(key, payload)) {
    // Last resort: try original without compression metadata noise
    writeRaw(key, JSON.stringify({ base64: img.base64, mimeType: img.mimeType }));
  }
}

export function saveDraftGender(gender: ChildGender): void {
  writeRaw(KEYS.gender, gender);
}

export function saveDraftPaymentToken(token: string | null): void {
  if (!token) removeRaw(KEYS.paymentToken);
  else writeRaw(KEYS.paymentToken, token);
}

export function clearDraftPhotos(): void {
  removeRaw(KEYS.dad);
  removeRaw(KEYS.mom);
}

export function clearDraftAfterSuccess(): void {
  clearDraftPhotos();
  removeRaw(KEYS.gender);
  removeRaw(KEYS.paymentToken);
  // Also clear any legacy keys from earlier builds
  removeRaw('dadImage');
  removeRaw('momImage');
  removeRaw('gender');
}

export function readPhotosForGenerate(): {
  dad: StoredImage | null;
  mom: StoredImage | null;
} {
  return {
    dad:
      parseStoredImage(readRaw(KEYS.dad)) ||
      parseStoredImage(readRaw('dadImage')),
    mom:
      parseStoredImage(readRaw(KEYS.mom)) ||
      parseStoredImage(readRaw('momImage')),
  };
}
