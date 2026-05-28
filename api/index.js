// server/app.ts
import cors from "cors";
import express4 from "express";

// server/lib/env.ts
function clean(v) {
  const trimmed = v?.trim();
  return trimmed ? trimmed : void 0;
}
function getEnv() {
  return {
    AI_PROVIDER: clean(process.env.AI_PROVIDER),
    AWS_REGION: clean(process.env.AWS_REGION),
    AWS_ACCESS_KEY_ID: clean(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: clean(process.env.AWS_SECRET_ACCESS_KEY),
    BEDROCK_MODEL_ID: clean(process.env.BEDROCK_MODEL_ID),
    OPENAI_API_KEY: clean(process.env.OPENAI_API_KEY),
    OPENAI_MODEL: clean(process.env.OPENAI_MODEL)
  };
}
function requireEnv(...keys) {
  const env = getEnv();
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
  return env;
}

// server/lib/aiProvider.ts
function getAiProvider() {
  const env = getEnv();
  const explicit = env.AI_PROVIDER?.toLowerCase();
  if (explicit === "openai") return "openai";
  if (explicit === "bedrock") return "bedrock";
  if (env.OPENAI_API_KEY) return "openai";
  return "bedrock";
}
function getOpenAiConfig() {
  const env = getEnv();
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? "gpt-4o-mini"
  };
}

// server/routes/chat.ts
import express from "express";

// server/lib/advisorPrompt.ts
function buildSystemPrompt(language, uploadedDocumentText) {
  const parts = [
    "You are a Goodwill Virtual Career Center AI Career Advisor.",
    "Your tone is supportive, practical, and low-jargon.",
    "You help with: finding a job, exploring career options, writing/improving resumes and CVs, practicing interview questions, building skills/training, finding local resources, and understanding job applications.",
    "Ask one question at a time. Do not overwhelm the user. Offer simple next steps.",
    "If uploaded resume/document text is included below, you DO have access to it. Do NOT say you cannot access attachments or files.",
    "You can perform live web searches when needed. Only include links when you are confident you understand exactly what the user is looking for. If the request is underspecified, ask 1\u20132 clarifying questions first.",
    "Never pretend to browse or search. Do not output placeholders like \u201C[Insert date]\u201D, \u201C[Insert location]\u201D, or \u201C[Searching for\u2026]\u201D. If fresh/local data is required and you cannot retrieve it, say so plainly and ask a clarifying question or provide safe next steps without inventing details.",
    "Do not claim you can apply for jobs on the user\u2019s behalf.",
    "Encourage verifying important job/resource details and suggest talking to a human career coach for complex situations.",
    `The user\u2019s selected language is: ${language}. Respond in that language when possible.`
  ];
  if (uploadedDocumentText && uploadedDocumentText.trim()) {
    parts.push(
      "Uploaded resume/document content is provided below. Use it to answer questions, summarize, and suggest improvements. Be careful with sensitive info and do not invent details.",
      "--- Uploaded resume/document content ---",
      uploadedDocumentText.slice(0, 3e4),
      "--- End uploaded content ---"
    );
  }
  return parts.join("\n");
}

// server/lib/bedrockChat.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
function isNovaModelId(modelId) {
  if (modelId.startsWith("amazon.nova")) return true;
  return modelId.startsWith("us.amazon.nova") || modelId.startsWith("eu.amazon.nova") || modelId.startsWith("global.amazon.nova");
}
function detectBedrockProvider(modelId) {
  if (modelId.startsWith("anthropic.") || modelId.startsWith("us.anthropic.") || modelId.startsWith("global.anthropic.")) {
    return "anthropic";
  }
  if (isNovaModelId(modelId)) {
    return "nova";
  }
  return null;
}
function novaInferenceProfileHint(modelId) {
  if (!modelId.startsWith("amazon.nova")) return void 0;
  const suffix = modelId.slice("amazon.".length);
  return `Use the inference profile id instead, e.g. us.${suffix} (set BEDROCK_MODEL_ID in .env and restart the server).`;
}
function toAnthropicMessages(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: [{ type: "text", text: m.content }]
  }));
}
function toNovaMessages(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }]
  }));
}
function parseNovaResponse(json) {
  const content = json?.output?.message?.content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => Boolean(block && typeof block.text === "string")).map((block) => block.text).join("");
}
function createBedrockClient(region, credentials) {
  return new BedrockRuntimeClient({
    region,
    credentials
  });
}
async function invokeAnthropicViaBedrock(params) {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 800,
    temperature: 0.4,
    system: params.system,
    messages: toAnthropicMessages(params.messages)
  };
  const cmd = new InvokeModelCommand({
    modelId: params.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(JSON.stringify(body))
  });
  const resp = await params.client.send(cmd);
  const text = new TextDecoder().decode(resp.body);
  const json = JSON.parse(text);
  return Array.isArray(json?.content) && json.content[0]?.type === "text" ? String(json.content[0].text ?? "") : "";
}
async function invokeNovaViaBedrock(params) {
  const body = {
    system: [{ text: params.system }],
    messages: toNovaMessages(params.messages),
    inferenceConfig: {
      maxTokens: 300,
      temperature: 0.4,
      topP: 0.9
    }
  };
  if (!params.modelId.includes("nova-2")) {
    body.schemaVersion = "messages-v1";
  }
  const cmd = new InvokeModelCommand({
    modelId: params.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(JSON.stringify(body))
  });
  const resp = await params.client.send(cmd);
  const text = new TextDecoder().decode(resp.body);
  const json = JSON.parse(text);
  return parseNovaResponse(json);
}
async function invokeBedrockChat(params) {
  const env = requireEnv("AWS_REGION", "BEDROCK_MODEL_ID");
  const fullEnv = getEnv();
  const modelId = env.BEDROCK_MODEL_ID;
  const bedrockProvider = detectBedrockProvider(modelId);
  if (!bedrockProvider) {
    throw new Error(
      `BEDROCK_MODEL_ID (${modelId}) is not supported. Use an Anthropic Claude id (anthropic.*, us.anthropic.*, global.anthropic.*) or an Amazon Nova id (us.amazon.nova*, eu.amazon.nova*, global.amazon.nova*, or amazon.nova* where on-demand is enabled).`
    );
  }
  const credentials = fullEnv.AWS_ACCESS_KEY_ID && fullEnv.AWS_SECRET_ACCESS_KEY ? { accessKeyId: fullEnv.AWS_ACCESS_KEY_ID, secretAccessKey: fullEnv.AWS_SECRET_ACCESS_KEY } : void 0;
  const client = createBedrockClient(env.AWS_REGION, credentials);
  return bedrockProvider === "anthropic" ? invokeAnthropicViaBedrock({ client, modelId, system: params.system, messages: params.messages }) : invokeNovaViaBedrock({ client, modelId, system: params.system, messages: params.messages });
}
function bedrockErrorHint(err, modelId) {
  const errMessage = String(err?.message ?? "");
  if (err?.name === "AccessDeniedException") {
    return "Check IAM permissions (bedrock:InvokeModel, bedrock:UseInferenceProfile) and Bedrock model access in the AWS Console.";
  }
  if (errMessage.includes("on-demand throughput") || errMessage.includes("inference profile")) {
    return novaInferenceProfileHint(modelId) ?? errMessage;
  }
  return errMessage || void 0;
}

// server/lib/errors.ts
function sendError(res, status, message, details) {
  res.status(status).json({
    error: {
      message,
      ...details ? { details } : {}
    }
  });
}

// server/lib/openaiChat.ts
async function invokeOpenAiChat(params) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        { role: "system", content: params.system },
        ...params.messages.map((m) => ({ role: m.role, content: m.content }))
      ]
    })
  });
  const raw = await response.text();
  if (!response.ok) {
    let detail = raw;
    try {
      const json2 = JSON.parse(raw);
      detail = json2?.error?.message ?? raw;
    } catch {
    }
    throw new Error(`OpenAI API error (${response.status}): ${detail}`);
  }
  const json = JSON.parse(raw);
  return String(json?.choices?.[0]?.message?.content ?? "");
}

// server/lib/webSearch.ts
function decodeHtml(s) {
  return s.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&#39;", "'");
}
function stripTags(s) {
  return s.replace(/<[^>]*>/g, "");
}
function normalizeSpace(s) {
  return s.replace(/\s+/g, " ").trim();
}
async function webSearch(query, limit = 5) {
  const q = query.trim();
  if (!q) return [];
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const resp = await fetch(url, {
    headers: {
      // Some deployments respond differently without a UA.
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!resp.ok) {
    throw new Error(`Web search failed (${resp.status})`);
  }
  const html = await resp.text();
  const results = [];
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;
  let match;
  while ((match = linkRe.exec(html)) && results.length < limit) {
    const rawHref = match[1] ?? "";
    const rawTitle = match[2] ?? "";
    const rawSnippet = match[3] ?? "";
    const title = normalizeSpace(decodeHtml(stripTags(rawTitle)));
    if (!title) continue;
    const href = decodeHtml(rawHref);
    const snippet = rawSnippet ? normalizeSpace(decodeHtml(stripTags(rawSnippet))) : void 0;
    results.push({ title, url: href, snippet });
  }
  return results;
}

// server/routes/chat.ts
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function missingEnvForProvider(provider) {
  const env = getEnv();
  if (provider === "openai") {
    const missing2 = [];
    if (!env.OPENAI_API_KEY) missing2.push("OPENAI_API_KEY");
    return missing2;
  }
  const missing = [];
  if (!env.AWS_REGION) missing.push("AWS_REGION");
  if (!env.BEDROCK_MODEL_ID) missing.push("BEDROCK_MODEL_ID");
  if (!env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
  return missing;
}
function hasLocationHint(s) {
  return /\b(in|near|around)\b\s+[a-z]/i.test(s) || /\b(ct|ma|ny|ri|nh|vt)\b/i.test(s) || /\b(remote)\b/i.test(s.toLowerCase());
}
function hasTimeHint(s) {
  return /\b(today|tomorrow|this week|this month|next week|next month|upcoming)\b/i.test(s) || /\b(20\d{2})\b/.test(s);
}
function detectSearchIntent(q) {
  const s = q.trim();
  const lower = s.toLowerCase();
  if (!s) return { kind: "none" };
  if (lower.includes("http://") || lower.includes("https://")) return { kind: "none" };
  const explicitSearch = /\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up)\b/.test(lower);
  const hasFindIntent = /\b(find|search|look\s*up|show\s*me)\b/.test(lower);
  const hasJobIntent = /\b(job|jobs|opening|openings|hiring|apply|positions|listings)\b/.test(lower);
  const hasEventIntent = /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|job expo|recruiting event|recruiting events|job festival|career event|career events)\b/.test(
    lower
  );
  const hasLocalResourceIntent = /\b(local resources|resources near me|community resources|career center|workshop|workshops|training event|training events)\b/.test(
    lower
  );
  if ((hasFindIntent || explicitSearch) && hasJobIntent) {
    const hasLocation = hasLocationHint(s);
    const hasRoleKeyword = /\b(retail|cashier|sales|warehouse|driver|manager|customer service|associate)\b/i.test(s);
    const needsClarification = !(hasLocation && hasRoleKeyword);
    const questions = [];
    if (!hasRoleKeyword) questions.push("What kind of role are you looking for (e.g., cashier, sales associate, store manager, warehouse, customer service)?");
    if (!hasLocation) questions.push("What location should I search (city + state, or \u201Cremote\u201D)?");
    return { kind: "jobs", query: s, needsClarification, questions: questions.slice(0, 2) };
  }
  if ((hasFindIntent || explicitSearch || hasEventIntent || hasLocalResourceIntent) && (hasEventIntent || hasLocalResourceIntent)) {
    const hasLocation = hasLocationHint(s);
    const needsClarification = !hasLocation;
    const questions = [];
    if (!hasLocation) questions.push("What city + state should I search?");
    if (!hasTimeHint(s)) questions.push("What timeframe should I search (e.g., \u201Cthis month\u201D, a specific date range, or \u201Cthis weekend\u201D)?");
    return { kind: "events", query: s, needsClarification, questions: questions.slice(0, 2) };
  }
  if (explicitSearch) {
    const cleaned = s.replace(/\b(web\s*search|google|search\s+the\s+web|look\s+this\s+up)\b/i, "").trim();
    const query = cleaned || s;
    const needsClarification = query.length < 6;
    const questions = needsClarification ? ["What exactly should I look up on the web?", "Are you looking to buy something, find a local place, or just get information?"] : [];
    return { kind: "general", query, needsClarification, questions: questions.slice(0, 2) };
  }
  return { kind: "none" };
}
function looksLikePlaceholderTemplate(text) {
  const s = text.toLowerCase();
  return /\[searching for/.test(s) || /\[insert (specific )?(date|time|location)/.test(s) || /\binsert (specific )?(date|time|location)\b/.test(s) || s.includes("please hold on for a moment") || s.includes("let me look up") && !s.includes("http");
}
function requiresFreshData(userText) {
  const s = userText.toLowerCase();
  return /\b(job fair|job fairs|career fair|career fairs|hiring event|hiring events|career expo|recruiting event|recruiting events)\b/.test(s) || /\b(this week|this month|next week|next month|upcoming|today|tomorrow)\b/.test(s) || /\b(local resources|near me)\b/.test(s);
}
function webResultsToContext(results) {
  return results.map((r, i) => {
    const snippet = r.snippet ? `
Snippet: ${r.snippet}` : "";
    return `Result ${i + 1}:
Title: ${r.title}
URL: ${r.url}${snippet}`;
  }).join("\n\n");
}
function isExplicitDocumentRequest(q) {
  const s = q.toLowerCase();
  return /\b(resume|résumé|cv|curriculum vitae)\b/.test(s) || /\bcover letter\b/.test(s) || /\b(write|draft|generate|create|format)\b/.test(s) && /\b(resume|résumé|cv|cover letter|letter)\b/.test(s);
}
var chatRouter = express.Router();
chatRouter.post("/", async (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.messages) || !isNonEmptyString(body.language)) {
    return sendError(res, 400, "Invalid request. Expected { messages: [...], language: string }.");
  }
  const aiProvider = getAiProvider();
  const missing = missingEnvForProvider(aiProvider);
  if (missing.length) {
    console.error(`[chat] Missing env vars for provider=${aiProvider}:`, missing.join(", "));
    return res.status(500).json({
      error: "Missing required environment variable",
      missing,
      provider: aiProvider
    });
  }
  const messages = body.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && isNonEmptyString(m.content)).slice(-30);
  if (messages.length === 0) {
    return sendError(res, 400, "Please provide at least one message.");
  }
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const intent = lastUser ? detectSearchIntent(lastUser) : { kind: "none" };
  const docOnly = Boolean(lastUser && isExplicitDocumentRequest(lastUser));
  const systemDocOnly = docOnly ? "\n\nIf the user requests a resume, CV, cover letter, or any written document, output ONLY the document text. Do NOT include any introduction, preface, commentary, or closing lines (no \u201CSure\u2026\u201D, no \u201CHere is\u2026\u201D, no \u201CFeel free\u2026\u201D, no \u201CWould you like help\u2026\u201D). Do not ask questions. The output must start immediately with the document content." : "";
  const searchSystemSuffix = intent.kind === "jobs" || intent.kind === "events" || intent.kind === "general" ? "\n\nIf a user request requires fresh/local/time-sensitive information, ask 1\u20132 clarifying questions before searching. When you do provide results, include only links that came from the web search context provided to you. Do not fabricate events, dates, locations, or pretend you searched if no results were provided." : "";
  const system = buildSystemPrompt(body.language, body.uploadedDocumentText) + systemDocOnly + searchSystemSuffix;
  let webContext = null;
  if ((intent.kind === "jobs" || intent.kind === "events" || intent.kind === "general") && !intent.needsClarification) {
    try {
      const results = await webSearch(intent.query, 6);
      webContext = results.length ? webResultsToContext(results) : null;
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      return sendError(res, 502, "Web search is temporarily unavailable. Please try again in a moment.", hint);
    }
  }
  const messagesWithWebContext = webContext ? [
    ...messages,
    {
      role: "assistant",
      content: "WEB_SEARCH_RESULTS (for grounding; do not invent beyond these):\n\n" + webContext + "\n\nWhen you answer, cite the relevant URLs."
    }
  ] : messages;
  if (aiProvider === "openai") {
    const { apiKey, model } = getOpenAiConfig();
    if (!apiKey) {
      console.error("[chat] OPENAI_API_KEY is not set while AI_PROVIDER=openai");
      return sendError(
        res,
        500,
        "Server is missing OpenAI configuration. Set OPENAI_API_KEY in your .env when AI_PROVIDER=openai."
      );
    }
    try {
      const reply = await invokeOpenAiChat({ apiKey, model, system, messages: messagesWithWebContext });
      if (!reply || !reply.trim()) {
        return sendError(res, 502, "The AI did not return a response. Please try again.");
      }
      if (lastUser && requiresFreshData(lastUser) && looksLikePlaceholderTemplate(reply)) {
        return sendError(
          res,
          502,
          "Unable to provide grounded results right now.",
          "The assistant produced placeholders for a time-sensitive query; blocking to prevent hallucinations. Please try again with city + state and timeframe."
        );
      }
      return res.json({ reply });
    } catch (err) {
      console.error("[chat] OpenAI error:", err);
      const hint = err instanceof Error ? err.message : String(err);
      return sendError(res, 502, "Unable to get an AI response right now. Please try again in a moment.", hint);
    }
  }
  try {
    requireEnv("AWS_REGION", "BEDROCK_MODEL_ID");
  } catch (e) {
    return sendError(
      res,
      500,
      "Server is missing AWS configuration. Set AWS_REGION and BEDROCK_MODEL_ID in your .env when AI_PROVIDER=bedrock.",
      e instanceof Error ? e.message : void 0
    );
  }
  const modelId = getEnv().BEDROCK_MODEL_ID ?? "";
  try {
    const reply = await invokeBedrockChat({ system, messages: messagesWithWebContext });
    if (!reply || !reply.trim()) {
      return sendError(res, 502, "The AI did not return a response. Please try again.");
    }
    if (lastUser && requiresFreshData(lastUser) && looksLikePlaceholderTemplate(reply)) {
      return sendError(
        res,
        502,
        "Unable to provide grounded results right now.",
        "The assistant produced placeholders for a time-sensitive query; blocking to prevent hallucinations. Please try again with city + state and timeframe."
      );
    }
    res.json({ reply });
  } catch (err) {
    console.error("[chat] Bedrock error:", err?.name ?? "Error", err);
    const hint = bedrockErrorHint(err, modelId);
    return sendError(res, 502, "Unable to get an AI response right now. Please try again in a moment.", hint);
  }
});

// server/routes/document.ts
import express2 from "express";
import { Document, Packer, Paragraph as Paragraph2 } from "docx";
import PDFDocument from "pdfkit";

// server/lib/markdown.ts
import { Paragraph, TextRun } from "docx";
function parseInline(md) {
  const out = [];
  let i = 0;
  let bold = false;
  let italics = false;
  let buf = "";
  const flush = () => {
    if (!buf) return;
    out.push({ text: buf, bold: bold || void 0, italics: italics || void 0 });
    buf = "";
  };
  while (i < md.length) {
    const ch = md[i];
    const next = md[i + 1];
    if (ch === "*" && next === "*") {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (ch === "_" && next === "_") {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (ch === "*") {
      flush();
      italics = !italics;
      i += 1;
      continue;
    }
    if (ch === "_") {
      flush();
      italics = !italics;
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush();
  const unbalanced = bold || italics;
  if (unbalanced) return [{ text: md }];
  return out.length ? out : [{ text: md }];
}
function markdownToDocxParagraphs(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const paragraphs = [];
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      paragraphs.push(new Paragraph(""));
      continue;
    }
    if (/^\s*---\s*$/.test(line)) {
      paragraphs.push(new Paragraph(""));
      continue;
    }
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: level === 1 ? 32 : level === 2 ? 28 : 24 })],
          spacing: { after: 180, before: 120 }
        })
      );
      continue;
    }
    const bulletMatch = /^(\s*)([-*•])\s+(.*)$/.exec(rawLine);
    if (bulletMatch) {
      const content = bulletMatch[3] ?? "";
      const runs2 = parseInline(content).map(
        (t) => new TextRun({
          text: t.text,
          bold: t.bold,
          italics: t.italics,
          size: 22
        })
      );
      paragraphs.push(
        new Paragraph({
          children: runs2.length ? runs2 : [new TextRun({ text: content, size: 22 })],
          bullet: { level: 0 }
        })
      );
      continue;
    }
    const runs = parseInline(line).map(
      (t) => new TextRun({
        text: t.text,
        bold: t.bold,
        italics: t.italics,
        size: 22,
        font: "Calibri"
      })
    );
    paragraphs.push(
      new Paragraph({
        children: runs.length ? runs : [new TextRun({ text: line, size: 22, font: "Calibri" })]
      })
    );
  }
  return paragraphs;
}
function markdownToPlainText(markdown) {
  return markdown.replace(/\r\n/g, "\n").replace(/^#{1,6}\s+/gm, "").replace(/^\s*[-*•]\s+/gm, "\u2022 ").replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
function sanitizeDocumentMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const isJunkLine = (line) => {
    const s = line.trim().toLowerCase();
    if (!s) return false;
    return s.startsWith("sure") || s.startsWith("here's") || s.startsWith("here is") || s.startsWith("below is") || s.startsWith("i can help") || s.startsWith("feel free") || s.includes("would you like help") || s.includes("anything else i can help") || s.includes("let me know if");
  };
  let start = 0;
  while (start < lines.length && (lines[start].trim() === "" || isJunkLine(lines[start]))) start++;
  let end = lines.length - 1;
  while (end >= start && (lines[end].trim() === "" || isJunkLine(lines[end]))) end--;
  return lines.slice(start, end + 1).join("\n").trim();
}

// server/routes/document.ts
function safeFileBase(name) {
  return name.replace(/[^a-z0-9_\-]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "resume";
}
var documentRouter = express2.Router();
async function sendDocx(res, opts) {
  const fileName = opts.fileBase.endsWith(".docx") ? opts.fileBase : `${opts.fileBase}.docx`;
  const clean2 = sanitizeDocumentMarkdown(opts.markdown);
  const paragraphs = markdownToDocxParagraphs(clean2);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length ? paragraphs : [new Paragraph2("")]
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(buffer);
}
async function sendPdf(res, opts) {
  const fileName = opts.fileBase.endsWith(".pdf") ? opts.fileBase : `${opts.fileBase}.pdf`;
  const clean2 = sanitizeDocumentMarkdown(opts.markdown);
  const text = markdownToPlainText(clean2);
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 54, bottom: 54, left: 54, right: 54 }
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  doc.on("error", () => {
  });
  doc.pipe(res);
  doc.font("Helvetica").fontSize(11);
  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      doc.moveDown(0.6);
      continue;
    }
    if (/^(objective|summary|experience|education|skills|projects|certifications|work experience)\b/i.test(line)) {
      doc.moveDown(0.2);
      doc.font("Helvetica-Bold").fontSize(12).text(line);
      doc.font("Helvetica").fontSize(11);
      continue;
    }
    doc.text(line);
  }
  doc.end();
}
documentRouter.post("/export", async (req, res) => {
  const body = req.body;
  if (!body || typeof body.content !== "string" || !body.content.trim() || body.format !== "docx" && body.format !== "pdf") {
    return sendError(res, 400, 'Invalid request. Expected { content: string, format: "docx" | "pdf" }.');
  }
  const fileBase = safeFileBase(body.fileName ?? (body.format === "pdf" ? "document" : "resume"));
  if (body.format === "pdf") {
    return sendPdf(res, { fileBase, markdown: body.content });
  }
  return sendDocx(res, { fileBase, markdown: body.content });
});
documentRouter.post("/resume", async (req, res) => {
  const body = req.body;
  if (!body || typeof body.resumeText !== "string" || !body.resumeText.trim()) {
    return sendError(res, 400, "Invalid request. Expected { resumeText: string }.");
  }
  const fileBase = safeFileBase(body.fileName ?? "resume");
  return sendDocx(res, { fileBase, markdown: body.resumeText });
});

// server/routes/upload.ts
import express3 from "express";
import mammoth from "mammoth";
import multer from "multer";

// server/lib/pdfText.ts
import { PDFParse } from "pdf-parse";
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

// server/routes/upload.ts
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES }
});
function extOf(name) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}
async function extractText(file) {
  const ext = extOf(file.originalname);
  if (ext === "txt") {
    return file.buffer.toString("utf8");
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value ?? "";
  }
  if (ext === "pdf") {
    return extractPdfText(file.buffer);
  }
  throw new Error("Unsupported file type. Please upload a .docx, .pdf, or .txt file.");
}
var uploadRouter = express3.Router();
uploadRouter.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return sendError(res, 400, "No file uploaded. Please choose a .docx, .pdf, or .txt file.");
  }
  try {
    const extractedText = (await extractText(file)).trim();
    if (!extractedText) {
      return sendError(res, 422, "We could not read any text from that file. Try a different file or format.");
    }
    res.json({
      fileName: file.originalname,
      extractedText
    });
  } catch (err) {
    return sendError(res, 400, err?.message ?? "Unable to process that file.");
  }
});

// server/app.ts
function createApp() {
  const app2 = express4();
  app2.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app2.use(express4.json({ limit: "1mb" }));
  app2.get("/api/health", (_req, res) => {
    try {
      const aiProvider = getAiProvider();
      const env = getEnv();
      const openAi = getOpenAiConfig();
      const openaiReady = Boolean(openAi.apiKey);
      res.json({
        ok: true,
        runtime: "vercel-serverless",
        aiProvider,
        openaiConfigured: openaiReady,
        openaiModel: openaiReady ? openAi.model : null,
        bedrockConfigured: Boolean(env.AWS_REGION && env.BEDROCK_MODEL_ID),
        region: env.AWS_REGION ?? null,
        modelId: env.BEDROCK_MODEL_ID ? "(set)" : null,
        ...aiProvider === "openai" && !openaiReady ? {
          warning: "AI_PROVIDER is openai but OPENAI_API_KEY is not set. Add it in Vercel \u2192 Settings \u2192 Environment Variables."
        } : {}
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Health check failed";
      res.status(500).json({ ok: false, error: { message, details: message } });
    }
  });
  app2.use("/api/chat", chatRouter);
  app2.use("/api/upload", uploadRouter);
  app2.use("/api/document", documentRouter);
  app2.use((err, _req, res, _next) => {
    console.error("[api] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({
      error: {
        message: "A server error has occurred",
        details: message
      }
    });
  });
  return app2;
}

// server/vercel.ts
var runtime = "nodejs";
var app = createApp();
function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error("[vercel] handler crash:", err);
    if (!res.headersSent) {
      const message = err instanceof Error ? err.message : "Server error";
      res.status(500).json({
        error: {
          message: "A server error has occurred",
          details: message
        }
      });
    }
  }
}
export {
  handler as default,
  runtime
};
