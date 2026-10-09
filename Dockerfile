# MiniMe AI — production image for Cloud Run / Cloud Build
# Cloud Build expects this file at the repository root.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes GEMINI_API_KEY into the client bundle at build time.
# Pass via Cloud Build: --build-arg GEMINI_API_KEY=$$GEMINI_API_KEY (from Secret Manager)
ARG GEMINI_API_KEY=
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Cloud Run sets PORT; serve static SPA with history fallback
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
