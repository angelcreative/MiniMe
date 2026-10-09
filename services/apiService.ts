import { ChildGender } from '../types';

export type CheckoutCurrency = 'EUR' | 'USD';

async function parseJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function createCheckoutSession(
  currency: CheckoutCurrency
): Promise<{ url: string; sessionId: string }> {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Amount is intentionally omitted — server sets the price.
    body: JSON.stringify({ currency }),
  });
  const data = await parseJson(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to initialize Stripe Checkout Session.');
  }
  return { url: data.url, sessionId: data.sessionId };
}

export async function verifyCheckoutSession(
  sessionId: string
): Promise<{ paymentToken: string } | null> {
  const res = await fetch(
    `/api/verify-session?session_id=${encodeURIComponent(sessionId)}`
  );
  const data = await parseJson(res);
  if (res.ok && data.success && data.paymentToken) {
    return { paymentToken: data.paymentToken };
  }
  return null;
}

export async function generateChildPortrait(params: {
  dadBase64: string;
  dadMimeType: string;
  momBase64: string;
  momMimeType: string;
  gender: ChildGender;
  paymentToken: string;
}): Promise<string> {
  const res = await fetch('/api/generate-baby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseJson(res);
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Failed to generate child portrait.'
    );
  }
  return data.resultImage as string;
}
