# Desplegar MiniMe (sin Google Cloud)

Recomendado: **Railway** (cuenta con GitHub, 5 minutos).

## 1) Railway

1. Entra en [https://railway.app](https://railway.app) → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo** → elige `angelcreative/MiniMe`.
3. Railway detecta el `Dockerfile` y despliega solo.
4. En el servicio → **Variables** → añade:

| Variable | Valor |
|----------|--------|
| `OPENAI_API_KEY` | tu clave `sk-…` de [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `STRIPE_SECRET_KEY` | tu `sk_live_…` o `sk_test_…` de Stripe |
| `PAYMENT_TOKEN_SECRET` | cualquier texto largo aleatorio (ej. 32+ caracteres) |
| `APP_BASE_URL` | la URL pública de Railway (paso 5) — luego la cambias a `https://myminime.space` |
| `PRICE_EUR_CENTS` | `100` |
| `PRICE_USD_CENTS` | `110` |

5. **Settings** → **Networking** → **Generate domain** → copia la URL (`https://….up.railway.app`).
6. Pon esa URL en `APP_BASE_URL` (o `https://myminime.space` cuando el dominio esté listo).
7. Abre `https://TU-URL.up.railway.app/api/health` → debe salir `"openai":true,"stripe":true`.

### Dominio myminime.space en Railway

1. En Railway → **Settings** → **Custom Domain** → `myminime.space`.
2. Railway te muestra un **CNAME** (o registro).
3. En tu DNS (Namecheap / donde esté el dominio):
   - Quita los registros viejos de Google (`216.239…`) del dominio.
   - Pon lo que Railway indique (suele ser CNAME a `….up.railway.app` o sus IPs).
4. Cuando el candado HTTPS esté OK, pon `APP_BASE_URL=https://myminime.space`.

## 2) Alternativa: Render

1. [https://render.com](https://render.com) → Login con GitHub.
2. **New** → **Blueprint** (usa `render.yaml`) o **Web Service** → repo MiniMe → Docker.
3. Mismas variables que arriba.
4. Dominio custom en Render → DNS.

## Por qué no Google Cloud

Cloud Run + permisos + AI Studio + facturación es demasiado frágil para un side project. Railway/Render: un repo, variables, URL HTTPS.
