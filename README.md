# Goodwill AI Career Center (Prototype)

This is a **local prototype** of the Goodwill Virtual Career Center experience:
- React + TypeScript + Vite frontend
- Node/Express backend API with OpenAI
- Optional: voice input + read aloud

## Requirements
- Node.js 18+
- OpenAI API key

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root (see `.env.example`):

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
PORT=8787
```

Optional model overrides:

```bash
OPENAI_MODEL_NANO=gpt-5-nano
OPENAI_MODEL_SEARCH_FALLBACK=gpt-5.5
```

Restart `npm run dev:all` after editing `.env` (env vars are loaded once at server startup).

## Run locally

Run both backend + frontend together:

```bash
npm run dev:all
```

- Frontend (Vite): `http://localhost:5173` (or the next free port Vite prints)
- Backend API: `http://127.0.0.1:8787` (Vite proxies `/api/*` to this port)

Important:
- Open the **Vite URL** for the app UI (not the API port).
- The frontend and API must use **different ports**. If both try to use `5175`, `/api/*` will fail with HTTP 502.
- Health check (backend): `http://127.0.0.1:8787/api/health` should return `"openaiConfigured": true`
- Health check (via Vite proxy): `http://localhost:5173/api/health`

### Troubleshooting

**HTTP 502 on `/api/health` when visiting port 5175**  
Vite took port 5175 and the API proxy pointed at itself. Restart with `npm run dev:all` after pulling latest changes (API uses port **8787** by default).

**Chat says “Unable to get an AI response”**  
Check the server terminal for the OpenAI error. Verify `OPENAI_API_KEY` is set and valid.

## Deploy on Vercel

The frontend and API deploy together. `npm run build` bundles the Express API into `api/_handler.cjs` for Vercel Serverless Functions.

**Environment variables** (Vercel → Project → Settings → Environment Variables):

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
# Optional (defaults shown):
# OPENAI_MODEL_NANO=gpt-5-nano
# OPENAI_MODEL_SEARCH_FALLBACK=gpt-5.5
```

Redeploy after changing env vars. Verify: `https://<your-app>.vercel.app/api/health` should return JSON with `"openaiConfigured": true`.

Locally, the API runs as a separate Express process (`npm run server`); on Vercel it runs as one bundled serverless function.

## API endpoints

- `POST /api/chat` — Career coaching, document analysis, and rare automatic web search. Returns `{ reply }`.
- `POST /api/search` — Dedicated live-search endpoint (rare; `/api/chat` handles search automatically).
- `POST /api/upload` — Upload `.docx`, `.pdf`, or `.txt` (max 5MB) and returns extracted text.
- `POST /api/document/export` — Download chat content as `.docx` or `.pdf`.
- `POST /api/document/resume` — Generate a downloadable `.docx` from resume text.

## Architecture

The advisor prioritizes, in order:

1. **Conversation** — one OpenAI call (`gpt-5-nano` by default)
2. **Uploaded documents** — one OpenAI call with document context (`gpt-5-mini`)
3. **Web search** — multi-stage pipeline only when current external information is required

## Architecture constraints (by design)
- No database
- No auth/login
- No credentials in the browser
