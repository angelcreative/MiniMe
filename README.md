# MiniMe AI

Upload photos of both parents and generate an AI prediction of their child at age 5 (Gemini), gated by a Stripe one-time payment.

Live site: [https://myminime.space](https://myminime.space)

## Security model (required for public launch)

1. **Gemini API key is server-only** — never `VITE_*`, never Vite `define`, never Docker build-arg into the SPA.
2. **Browser calls `/api/generate-baby`** — it cannot call Gemini directly.
3. **Stripe Checkout amount is set on the server** — the client may choose currency only.
4. **After `payment_status === paid`**, the API issues a **HMAC one-time `paymentToken`** (TTL).
5. **`/api/generate-baby` verifies + consumes the token before** calling Gemini (one payment → one generation).
6. Rate limits on checkout and generate.

## Local development

```bash
cp .env.example .env
# set GEMINI_API_KEY, STRIPE_SECRET_KEY, PAYMENT_TOKEN_SECRET

npm install
npm run dev:api   # Express on :8080
npm run dev       # Vite on :3000, proxies /api → :8080
```

## Production (Cloud Run)

```bash
npm run build
npm start   # serves dist/ + /api/* on $PORT
```

Dockerfile builds the SPA **without** secrets, then runs `node server/index.mjs`. Inject at **runtime**:

| Env | Purpose |
|-----|---------|
| `GEMINI_API_KEY` | Server-side Gemini |
| `STRIPE_SECRET_KEY` | Checkout + session verify |
| `PAYMENT_TOKEN_SECRET` | HMAC for one-time tokens (use a dedicated secret) |
| `APP_BASE_URL` | `https://myminime.space` for Stripe redirect URLs |
| `PRICE_EUR_CENTS` / `PRICE_USD_CENTS` | Fixed prices (default 100 / 110) |

## API

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/create-checkout-session` | Body: `{ currency }` only |
| GET | `/api/verify-session?session_id=` | Returns `{ paymentToken }` iff paid & unused |
| POST | `/api/generate-baby` | Requires `paymentToken`; consumes it |
| GET | `/api/health` | Config presence (no secrets) |

## Stack

- Vite 6 + React 19 + TypeScript (SPA)
- Express API (Stripe + `@google/genai`)
- Cloud Run
