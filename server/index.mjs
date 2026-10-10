/**
 * MiniMe AI API — Stripe entitlement gate + server-side OpenAI Images.
 * Secrets stay in process env; never ship to the browser.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import OpenAI, { toFile } from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 8080);
const PRICE_EUR_CENTS = Number(process.env.PRICE_EUR_CENTS || 100); // €1.00
const PRICE_USD_CENTS = Number(process.env.PRICE_USD_CENTS || 110); // $1.10
const TOKEN_TTL_MS = Number(process.env.PAYMENT_TOKEN_TTL_MS || 15 * 60 * 1000);
const APP_BASE_URL = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';
const creatorBypassSecret = process.env.CREATOR_BYPASS_SECRET || '';
const tokenSecret =
  process.env.PAYMENT_TOKEN_SECRET ||
  process.env.STRIPE_SECRET_KEY ||
  '';

if (!tokenSecret) {
  console.warn(
    '[minime] PAYMENT_TOKEN_SECRET / STRIPE_SECRET_KEY missing — tokens cannot be issued safely.'
  );
}

function isValidCreatorBypass(provided) {
  if (!creatorBypassSecret || typeof provided !== 'string' || !provided) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(creatorBypassSecret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

/** @type {Map<string, number>} sessionId -> consumedAt */
const consumedSessions = new Map();
/** @type {Map<string, number>} jti -> consumedAt */
const consumedTokens = new Map();
/** @type {Set<string>} jti currently generating (prevents parallel double-spend) */
const inflightTokens = new Set();

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

function sessionAlreadyConsumed(session) {
  return String(session?.metadata?.minime_consumed || '') === '1';
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

/** Durable one-use mark on Stripe so redeploys cannot revive a spent payment. */
async function markSessionConsumedOnStripe(sessionId) {
  if (!stripe || !sessionId) return;
  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      product: 'minime-generation',
      generations: '1',
      minime_consumed: '1',
      minime_consumed_at: new Date().toISOString(),
    },
  });
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

function stripDataUrl(value) {
  const s = String(value || '');
  const i = s.indexOf(',');
  return i >= 0 ? s.slice(i + 1) : s;
}

/** Same set as the client: JPEG/JPG (incl. pjpeg), PNG, WebP. */
const ACCEPTED_PARENT_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
]);

/**
 * Normalize phone / browser MIME quirks to a canonical type OpenAI accepts.
 * OpenAI Images edit accepts PNG, WEBP, and JPG — keep WebP as-is.
 */
function normalizeParentMime(mime) {
  const m = String(mime || '')
    .toLowerCase()
    .trim();
  if (m === 'image/jpg' || m === 'image/pjpeg') return 'image/jpeg';
  if (ACCEPTED_PARENT_MIMES.has(m)) return m;
  return null;
}

function assertParentMime(mime, role) {
  const normalized = normalizeParentMime(mime);
  if (!normalized) {
    const err = new Error(
      `${role} photo must be JPG, PNG, or WebP (received: ${mime || 'unknown'}). iPhone HEIC is not supported — export as JPG in Photos.`
    );
    err.status = 400;
    throw err;
  }
  return normalized;
}

function extForMime(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

async function generateWithOpenAI({ dadBase64, dadMimeType, momBase64, momMimeType, gender }) {
  if (!openaiKey) {
    const err = new Error('OpenAI is not configured on the server (set OPENAI_API_KEY).');
    err.status = 503;
    throw err;
  }

  const dadMime = assertParentMime(dadMimeType, 'Dad');
  const momMime = assertParentMime(momMimeType, 'Mom');

  const openai = new OpenAI({ apiKey: openaiKey });
  const dadBuf = Buffer.from(stripDataUrl(dadBase64), 'base64');
  const momBuf = Buffer.from(stripDataUrl(momBase64), 'base64');

  // Soft size guard after client compress (~15MB raw each would be enormous as base64).
  const MAX_PARENT_BYTES = 12 * 1024 * 1024;
  if (dadBuf.length > MAX_PARENT_BYTES || momBuf.length > MAX_PARENT_BYTES) {
    const err = new Error(
      'A parent photo is too large after upload. Please use a JPG/PNG/WebP under 15MB.'
    );
    err.status = 413;
    throw err;
  }

  const dadFile = await toFile(dadBuf, `dad.${extForMime(dadMime)}`, {
    type: dadMime,
  });
  const momFile = await toFile(momBuf, `mom.${extForMime(momMime)}`, {
    type: momMime,
  });

  const response = await openai.images.edit({
    model: OPENAI_IMAGE_MODEL,
    image: [dadFile, momFile],
    prompt: CHILD_PROMPT(gender),
    size: '1024x1024',
    quality: 'high',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    const err = new Error('No image data found in the OpenAI response.');
    err.status = 502;
    throw err;
  }
  return `data:image/png;base64,${b64}`;
}

const app = express();
app.set('trust proxy', 1);
// Two parent photos as data-URLs after client compress; 25mb leaves headroom for phones.
app.use(express.json({ limit: '25mb' }));

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

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Try again later.' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    stripe: Boolean(stripe),
    openai: Boolean(openaiKey),
    imageModel: OPENAI_IMAGE_MODEL,
    tokenSigner: Boolean(tokenSecret),
    creatorBypass: Boolean(creatorBypassSecret),
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
              description: 'One-time fee for a single AI child portrait.',
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

app.get('/api/verify-session', verifyLimiter, async (req, res) => {
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

    if (sessionAlreadyConsumed(session) || consumedSessions.has(sessionId)) {
      consumedSessions.set(sessionId, Date.now());
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
    const msg = String(err?.message || '');
    if (/No such checkout\.session/i.test(msg)) {
      return res.status(404).json({
        success: false,
        message: 'Unknown or invalid Stripe Checkout session.',
      });
    }
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
      creatorBypass,
    } = req.body || {};

    const bypassOk = isValidCreatorBypass(creatorBypass);
    let payload = null;

    if (!bypassOk) {
      payload = verifyToken(paymentToken);
      if (!payload) {
        return res.status(403).json({
          success: false,
          message:
            'Access Denied: Please complete payment to authorize AI generation.',
        });
      }

      if (
        consumedSessions.has(payload.sid) ||
        consumedTokens.has(payload.jti) ||
        inflightTokens.has(payload.jti)
      ) {
        return res.status(409).json({
          success: false,
          message: 'This payment token was already used or is in progress.',
        });
      }

      // Re-check Stripe: still paid, exact fee, and not already consumed (survives redeploys).
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
          if (sessionAlreadyConsumed(session)) {
            consumedSessions.set(payload.sid, Date.now());
            consumedTokens.set(payload.jti, Date.now());
            return res.status(409).json({
              success: false,
              message: 'This payment token was already used or is in progress.',
            });
          }
        } catch (e) {
          console.warn('stripe re-check failed', e?.message);
          return res.status(403).json({
            success: false,
            message: 'Access Denied: could not re-validate payment.',
          });
        }
      } else {
        return res.status(503).json({
          success: false,
          message: 'Stripe is not configured on the server.',
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
    const lockKey = bypassOk ? `bypass:${creatorBypass.slice(0, 8)}` : payload.jti;
    if (inflightTokens.has(lockKey)) {
      return res.status(409).json({
        success: false,
        message: 'A generation is already in progress. Please wait.',
      });
    }
    inflightTokens.add(lockKey);
    try {
      const resultImage = await generateWithOpenAI({
        dadBase64,
        dadMimeType,
        momBase64,
        momMimeType,
        gender: g,
      });

      // Paid flow: burn token only after success. Creator bypass is not single-use.
      if (!bypassOk) {
        if (!consumePaymentToken(payload)) {
          return res.status(409).json({
            success: false,
            message: 'This payment token was already used.',
          });
        }
        try {
          await markSessionConsumedOnStripe(payload.sid);
        } catch (e) {
          // Memory mark already applied; Stripe mark is best-effort durable backup.
          console.warn('stripe consume mark failed', e?.message);
        }
      }

      return res.json({ success: true, resultImage, creator: bypassOk || undefined });
    } finally {
      inflightTokens.delete(lockKey);
    }
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
    `[minime] stripe=${Boolean(stripe)} openai=${Boolean(openaiKey)} model=${OPENAI_IMAGE_MODEL} prices=EUR:${PRICE_EUR_CENTS}¢ USD:${PRICE_USD_CENTS}¢`
  );
});
