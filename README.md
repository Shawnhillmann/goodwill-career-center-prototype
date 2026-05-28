# Goodwill AI Career Center (Prototype)

This is a **local prototype** of the Goodwill Virtual Career Center experience:
- React + TypeScript + Vite frontend
- Local Node/Express backend API
- AWS Bedrock for AI responses (default), with optional OpenAI fallback for local dev (no credentials in the browser)
- Optional: voice input + read aloud

## Requirements
- Node.js 18+
- An AWS account with **Bedrock model access enabled**

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root (see `.env.example`).

**Bedrock (default):**

```bash
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
PORT=8787
```

**OpenAI (local prototype fallback):**

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
PORT=8787
```

AWS Bedrock variables can stay in `.env` while using OpenAI; switch back with `AI_PROVIDER=bedrock`.

Notes:
- `AI_PROVIDER`: optional `openai` or `bedrock`. If unset, the server uses **OpenAI when `OPENAI_API_KEY` is set**, otherwise Bedrock.
- Restart `npm run dev:all` after editing `.env` (env vars are loaded once at server startup).
- `BEDROCK_MODEL_ID` depends on what models/regions are enabled in your account. The backend routes by provider:
  - **Anthropic Claude:** ids starting with `anthropic.`, `us.anthropic.`, or `global.anthropic.`
  - **Amazon Nova:** inference profile ids such as `us.amazon.nova-2-lite-v1:0` (also `eu.amazon.nova*`, `global.amazon.nova*`). Nova 2 models often reject on-demand `amazon.nova-*` ids — use the geo profile from the Bedrock console (e.g. `us.amazon.nova-2-lite-v1:0` for US).
- **Do not use** `anthropic.claude-3-5-sonnet-20240620-v1:0` — it is end-of-life on Bedrock.
- For Claude 3.5 Sonnet v2 and most newer Claude models, use the **inference profile ID** (starts with `us.` or `global.`), not the raw `anthropic.*` model id. In Bedrock console: **Inference profiles** → copy the profile id (example: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`).
- List profiles in your account: `aws bedrock list-inference-profiles --region us-east-1`
- The IAM principal must allow `bedrock:InvokeModel`.
- On Windows, if `AWS_REGION` or `BEDROCK_MODEL_ID` are set to empty values in your system environment, dotenv must use `override: true` (the server does this). Restart the backend after editing `.env`.

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
- Health check (backend): `http://127.0.0.1:8787/api/health` should return `"bedrockConfigured": true`
- Health check (via Vite proxy): `http://localhost:5173/api/health`

### Troubleshooting

**HTTP 502 on `/api/health` when visiting port 5175**  
Vite took port 5175 and the API proxy pointed at itself. Restart with `npm run dev:all` after pulling latest changes (API uses port **8787** by default).

**Chat says “Unable to get an AI response”**  
Check the server terminal for the Bedrock error.

| Error | Fix |
|-------|-----|
| “end of its life” | Replace deprecated model ids (e.g. `…20240620…`) with a current inference profile such as `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |
| “on-demand throughput isn’t supported” | Use the **inference profile id** (`us.anthropic.…`), not the raw `anthropic.…` model id |
| `AccessDeniedException` | Enable model access + `bedrock:InvokeModel` in IAM |

## API endpoints

- `POST /api/chat`
  - Calls AWS Bedrock and returns `{ reply }`
- `POST /api/upload`
  - Upload `.docx`, `.pdf`, or `.txt` (max 5MB) and returns extracted text
- `POST /api/document/resume`
  - Generates a downloadable `.docx` from provided `resumeText`

## Architecture constraints (by design)
- No database
- No auth/login
- No S3 / permanent storage
- Uploaded document text is kept in-memory on the client for the current session

