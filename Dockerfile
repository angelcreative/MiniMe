# MiniMe AI — Cloud Run image: Vite SPA + Express API (Stripe + Gemini server-side)

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Do NOT pass OPENAI_API_KEY / Stripe secrets as build-args.
# Vite must never inline API secrets into the browser bundle.
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 8080

# Runtime secrets via Cloud Run env / Secret Manager:
#   OPENAI_API_KEY, STRIPE_SECRET_KEY, PAYMENT_TOKEN_SECRET, APP_BASE_URL
CMD ["node", "server/index.mjs"]
