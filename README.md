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

Optional: set `OPENAI_MODEL_NANO` only if you explicitly want nano for chat (default is mini).

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
```

Redeploy after changing env vars. Verify: `https://<your-app>.vercel.app/api/health` should return JSON with `"openaiConfigured": true`.

## API endpoints

- `POST /api/chat` — Career coaching, confirm-first web search, and document analysis. Returns `{ reply, conversationState }`. Supports streaming via SSE when `stream: true`.
- `POST /api/upload` — Upload `.docx`, `.pdf`, or `.txt` (max 5MB) and returns extracted text.
- `POST /api/document/export` — Download chat content as `.docx` or `.pdf`.
- `POST /api/document/resume` — Generate a downloadable `.docx` from resume text.

## Architecture

Single OpenAI path for all advisor replies (`gpt-5-mini` via `OPENAI_MODEL` by default):

1. **Conversation** — career coaching, interview prep, educational explanations
2. **Confirm-first web search** — live lookup for any topic (jobs, wages, people, places, programs, laws, events, etc.)
3. **User-provided URLs** — server fetches pasted links and supplies page text to the model
4. **Uploaded documents** — resume analysis, tailoring, cover letters
5. **Doc-only generation** — full resume/CV/cover letter output when requested

### Web access model

The advisor has three ways to use live or external information:

| Mode | When | What happens |
|------|------|----------------|
| **Coaching / education** | Evergreen concepts, how-to questions | Answer directly from the model — no search workflow |
| **Confirm-first web search** | Current, local, external, or changing facts | Clarify if needed → proposed search → user confirms → OpenAI `web_search` runs |
| **URL paste** | User includes a specific link | Server fetches that page only (`pageFetch`) — separate from open-ended search |

**Live search never runs automatically.** The user must explicitly confirm (e.g. **CONFIRM SEARCH** button or typed confirmation) after seeing a proposed search.

### Search workflow (topic-agnostic)

Search is **not job-only**. Users can look up jobs, wages, people, organizations, training, laws, local resources, companies, schools, events, and other real-world topics.

Flow:

1. **Classify** the user message (`shared/searchClassification.ts`)
   - **Coaching** — e.g. “What is a resume?”, “How do I prepare for an interview?” → normal reply
   - **Clarification required** — ambiguous or low-confidence requests (e.g. “john smith”, “goodwill”, “resources”) → ask follow-ups first; do not create a search plan yet
   - **Search confirmation** — specific enough to propose a search → restate query and ask for confirmation
2. **Clarify if needed** — job searches use a richer detail checklist; non-job searches only clarify when too vague
3. **Proposed search** — assistant restates: “I can look that up. Just to confirm, you want me to search for…”
4. **CONFIRM SEARCH** — user approves via button or phrase
5. **Execution** — server calls OpenAI Responses API with `web_search` (enabled by default; set `WEB_SEARCH_ENABLED=0` to disable)

Classification rules (summary):

- **Enter confirmation:** current/local/external/changing facts — minimum wage, hiring near a city, OSHA training near Hartford, who runs Goodwill in Boston, etc.
- **Stay coaching:** general knowledge and career education — what is networking, what is OSHA (as a concept), how cover letters work, transferable skills, interview prep
- **Clarify first:** bare names, single org names, generic words (“resources”, “jobs”) without enough context

Search confidence (`high` / `medium` / `low`) controls whether the assistant may offer a search plan immediately or must ask clarifying questions first. See `shared/searchClassification.ts` and `shared/searchClassification.test.ts`.

### Structured search plans (implementation detail)

When ready to confirm, the assistant appends a hidden metadata block to its reply:

```html
<!--SEARCH_PLAN:{"action":"search_confirmation_required","search_query":"...","search_confidence":"high",...}-->
```

The server strips this before displaying the message and stores the parsed plan in `conversationState.pendingSearchPlan`. The UI shows the confirmation prompt and **Confirm search** button from that structured state (also persisted in `localStorage` for refresh recovery).

This hidden-block approach is the **current implementation**. A follow-up may move `searchPlan` to a top-level API response field instead of embedding it in assistant content.

Key modules:

| Module | Purpose |
|--------|---------|
| `shared/searchClassification.ts` | Coaching vs clarification vs search confirmation; confidence scoring |
| `shared/searchPlan.ts` | `SearchPlan` type, block format, normalization |
| `shared/searchFinalize.ts` | Parse/strip `SEARCH_PLAN` from assistant replies |
| `shared/searchConfirm.ts` | Workflow phases, confirm gate, state reconstruction |
| `shared/conversationState.ts` | Pending search/resume actions |
| `server/lib/searchWorkflowPrompt.ts` | Prompt rules per workflow phase |
| `server/routes/chat.ts` | Routes confirm turns to `web_search` execution |

Server logs include `searchClassification`, `searchConfidence`, and `ambiguousEntity` on each chat request for debugging.

Optional env:

```bash
WEB_SEARCH_ENABLED=1   # default on; set 0 or false to disable live search execution
```

## Architecture constraints (by design)
- No database
- No auth/login
- No credentials in the browser
- Live web search requires explicit user confirmation (never automatic)
