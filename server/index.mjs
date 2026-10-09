/**
 * MiniMe AI API — Stripe entitlement gate + server-side Gemini.
 * Secrets stay in process env; never ship to the browser.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 8080);
const PRICE_EUR_CENTS = Number(process.env.PRICE_EUR_CENTS || 100); // €1.00
const PRICE_USD_CENTS = Number(process.env.PRICE_USD_CENTS || 110); // $1.10
const TOKEN_TTL_MS = Number(process.env.PAYMENT_TOKEN_TTL_MS || 15 * 60 * 1000);
const APP_BASE_URL = (process.env.APP_BASE_URL || '').replace(/\/$/, '');

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';
const tokenSecret =
  process.env.PAYMENT_TOKEN_SECRET ||
  process.env.STRIPE_SECRET_KEY ||
  '';

if (!tokenSecret) {
  console.warn(
    '[minime] PAYMENT_TOKEN_SECRET / STRIPE_SECRET_KEY missing — tokens cannot be issued safely.'
  );
}

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

/** @type {Map<string, number>} sessionId -> consumedAt */
const consumedSessions = new Map();
/** @type {Map<string, number>} jti -> consumedAt */
const consumedTokens = new Map();

function pruneConsumed(map, maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [k, ts] of map) {
    if (ts < cutoff) map.delete(k);
  }
}

function priceForCurrency(currency) {
  const c = String(currency || 'eur').toLowerCase();
  if (c === 'usd') return { currency: 'usd', unitAmount: PRICE_USD_CENTS };
  return { currency: 'eur', unitAmount: PRICE_EUR_CENTS };
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !tokenSecret) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', tokenSecret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.sid || !payload?.jti || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function issuePaymentToken(sessionId) {
  pruneConsumed(consumedSessions);
  pruneConsumed(consumedTokens);
  if (consumedSessions.has(sessionId)) {
    return { error: 'This payment has already been used for a generation.' };
  }
  const payload = {
    sid: sessionId,
    jti: crypto.randomUUID(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return { token: signToken(payload) };
}

function consumePaymentToken(payload) {
  pruneConsumed(consumedSessions);
  pruneConsumed(consumedTokens);
  if (consumedSessions.has(payload.sid) || consumedTokens.has(payload.jti)) {
    return false;
  }
  consumedSessions.set(payload.sid, Date.now());
  consumedTokens.set(payload.jti, Date.now());
  return true;
}

const CHILD_PROMPT = (gender) => `
GENETIC INHERITANCE MODE ACTIVE
Do NOT blend the two faces directly.
Analyze each parent face independently and generate a child that follows REAL GENETIC HEREDITY RULES.

Generate the MOST GENETICALLY PROBABLE biological child of the two people shown in the images.
- Child age: 5 years old
- Gender: ${gender}
- Style: Ultra-realistic, photographic, high detail, studio soft lighting
- Ensure resemblance to both parents; maintain human proportions

Image 1 = Father, Image 2 = Mother
`.trim();

async function generateWithGemini({ dadBase64, dadMimeType, momBase64, momMimeType, gender }) {
  if (!geminiKey) {
    const err = new Error('Gemini is not configured on the server.');
    err.status = 503;
    throw err;
  }
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const cleanDad = String(dadBase64).split(',')[1] || dadBase64;
  const cleanMom = String(momBase64).split(',')[1] || momBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: dadMimeType, data: cleanDad } },
        { inlineData: { mimeType: momMimeType, data: cleanMom } },
        { text: CHILD_PROMPT(gender) },
      ],
    },
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  const err = new Error('No image data found in the Gemini response.');
  err.status = 502;
  throw err;
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout attempts. Try again later.' },
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many generation attempts. Try again later.' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    stripe: Boolean(stripe),
    gemini: Boolean(geminiKey),
    tokenSigner: Boolean(tokenSecret),
  });
});

app.post('/api/create-checkout-session', checkoutLimiter, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured on the server.',
      });
    }

    // Currency may be chosen by the client; amount is NEVER trusted.
    const { currency: requested } = req.body || {};
    const { currency, unitAmount } = priceForCurrency(requested);
    const origin =
      APP_BASE_URL ||
      `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: 'MiniMe AI — Baby Portrait Generation',
              description: 'One-time fee for a single Gemini AI child portrait.',
            },
          },
        },
      ],
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_cancelled=1`,
      metadata: {
        product: 'minime-generation',
        generations: '1',
      },
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('create-checkout-session', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to create Stripe Checkout Session.',
    });
  }
});

app.get('/api/verify-session', async (req, res) => {
  try {
    if (!stripe || !tokenSecret) {
      return res.status(503).json({
        success: false,
        message: 'Payment verification is not configured on the server.',
      });
    }

    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing session_id parameter.',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Session status is not paid: ${session.payment_status || session.status}`,
      });
    }

    const expected = priceForCurrency(session.currency);
    // Require exact configured price (reject null, €0, underpay, wrong currency amount).
    if (
      typeof session.amount_total !== 'number' ||
      session.amount_total !== expected.unitAmount
    ) {
      return res.status(402).json({
        success: false,
        message: 'Paid amount does not match the required generation fee.',
      });
    }

    if (consumedSessions.has(sessionId)) {
      return res.status(409).json({
        success: false,
        message: 'This payment has already been used for a generation.',
      });
    }

    const issued = issuePaymentToken(sessionId);
    if (issued.error) {
      return res.status(409).json({ success: false, message: issued.error });
    }

    return res.json({ success: true, paymentToken: issued.token });
  } catch (err) {
    console.error('verify-session', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to verify Stripe session.',
    });
  }
});

app.post('/api/generate-baby', generateLimiter, async (req, res) => {
  try {
    const {
      dadBase64,
      dadMimeType,
      momBase64,
      momMimeType,
      gender,
      paymentToken,
    } = req.body || {};

    const payload = verifyToken(paymentToken);
    if (!payload) {
      return res.status(403).json({
        success: false,
        message:
          'Access Denied: Please complete payment to authorize Gemini AI generation.',
      });
    }

    // Consume BEFORE calling Gemini so retries/races cannot multiply cost.
    if (!consumePaymentToken(payload)) {
      return res.status(409).json({
        success: false,
        message: 'This payment token was already used.',
      });
    }

    // Re-check Stripe in case token was issued then refunded/expired edge cases.
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(payload.sid);
        if (session.payment_status !== 'paid') {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: payment is no longer valid.',
          });
        }
        const expected = priceForCurrency(session.currency);
        if (
          typeof session.amount_total !== 'number' ||
          session.amount_total !== expected.unitAmount
        ) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: paid amount does not match the required fee.',
          });
        }
      } catch (e) {
        console.warn('stripe re-check failed', e?.message);
        return res.status(403).json({
          success: false,
          message: 'Access Denied: could not re-validate payment.',
        });
      }
    }

    if (!dadBase64 || !momBase64 || !dadMimeType || !momMimeType) {
      return res.status(400).json({
        success: false,
        message: 'Missing parent image data.',
      });
    }

    const g = gender === 'boy' ? 'boy' : 'girl';
    const resultImage = await generateWithGemini({
      dadBase64,
      dadMimeType,
      momBase64,
      momMimeType,
      gender: g,
    });

    return res.json({ success: true, resultImage });
  } catch (err) {
    console.error('generate-baby', err);
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to generate child portrait.',
    });
  }
});

// Static SPA (production). In Vite dev, the frontend is served by Vite with a proxy.
const distDir = path.join(ROOT, 'dist');
app.use(express.static(distDir));
// Express 5 path-to-regexp: use middleware fallback (not app.get('*')).
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[minime] listening on :${PORT}`);
  console.log(
    `[minime] stripe=${Boolean(stripe)} gemini=${Boolean(geminiKey)} prices=EUR:${PRICE_EUR_CENTS}¢ USD:${PRICE_USD_CENTS}¢`
  );
});
