# MiniMe AI

Upload photos of both parents and generate an AI prediction of their child at age 5 (Gemini).

Live site: [https://myminime.space](https://myminime.space) — was returning **HTTP 503** because Cloud Build could not find a root `Dockerfile`.

## Root cause

Google Cloud Build log:

```text
unable to prepare context: unable to evaluate symlinks in Dockerfile path:
lstat /workspace/Dockerfile: no such file or directory
```

Cloud Build expects a **`Dockerfile` at the repository root**. Without a successful image build, Cloud Run / App Engine has no healthy revision → Google Frontend 503.

## Local development

```bash
cp .env.example .env   # optional: set GEMINI_API_KEY
npm install
npm run dev -- --port 3847 --host 127.0.0.1
```

Open [MiniMe AI](http://127.0.0.1:3847). Without `GEMINI_API_KEY`, generate still works in **demo mode** (placeholder child image).

Production build:

```bash
npm run build
npm run preview
```

## Cloud Build / Cloud Run

This repo includes:

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage: Vite build → `serve` static SPA on `$PORT` (default 8080) |
| `.dockerignore` | Keeps `node_modules` / secrets out of the build context |

### Example `cloudbuild.yaml` (if you use YAML triggers)

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -t
      - gcr.io/$PROJECT_ID/minime-ai:$COMMIT_SHA
      - --build-arg
      - GEMINI_API_KEY=$_GEMINI_API_KEY
      - .
  - name: gcr.io/cloud-builders/docker
    args: [push, gcr.io/$PROJECT_ID/minime-ai:$COMMIT_SHA]
images:
  - gcr.io/$PROJECT_ID/minime-ai:$COMMIT_SHA
```

Or keep a Docker trigger with **Dockerfile path** = `Dockerfile` and **context** = `.`.

### After pushing this fix

1. Re-run the Cloud Build trigger connected to `angelcreative/MiniMe` (or push this Dockerfile into that private repo).
2. Deploy / update the Cloud Run service (or GAE Flexible) to the new image; port **8080**.
3. Pass `GEMINI_API_KEY` as a **build-arg** (Vite inlines it) and/or verify Secret Manager substitution in the trigger.
4. Confirm custom domain `myminime.space` points at the healthy service.

## Stack

- Vite 6 + React 19 + TypeScript
- `@google/genai` (Gemini image model)
- Tailwind via CDN (dev/prod)
