/**
 * Tests for structured advisor response parsing and sanitization.
 * Run: npm run test:structured
 */
import assert from 'node:assert/strict'
import {
  extractJsonObject,
  extractVisibleReplyFromModelOutput,
  parseStructuredAdvisorJson,
  sanitizeVisibleReply,
} from '../server/lib/advisorStructuredResponse.ts'

const messages = [{ role: 'user' as const, content: 'Help me find a job' }]

// Pure JSON
{
  const raw = JSON.stringify({
    reply: 'Would you like me to search current job postings online?',
    offerWebSearch: { topic: 'jobs', querySoFar: 'current job postings' },
  })
  const parsed = parseStructuredAdvisorJson(raw, messages)
  assert.equal(parsed?.reply, 'Would you like me to search current job postings online?')
  assert.equal(parsed?.offerWebSearch?.topic, 'jobs')
  assert.equal(parsed?.offerWebSearch?.querySoFar, 'current job postings')
}

// Mixed prose + JSON (the reported bug)
{
  const mixed = `Nice — happy to help. Would you like me to search current job postings online?
{ "offerWebSearch": { "topic": "jobs", "querySoFar": "current job postings" }, "reply": "ignored" }`
  const parsed = parseStructuredAdvisorJson(mixed, messages)
  assert.equal(
    parsed?.reply,
    'Nice — happy to help. Would you like me to search current job postings online?',
  )
  assert.equal(parsed?.offerWebSearch?.topic, 'jobs')
  assert.ok(!parsed?.reply.includes('offerWebSearch'))
}

// JSON leaked inside reply field
{
  const raw = JSON.stringify({
    reply: 'Hello there { "offerWebSearch": { "topic": "jobs" } }',
    offerWebSearch: null,
  })
  const parsed = parseStructuredAdvisorJson(raw, messages)
  assert.equal(parsed?.reply, 'Hello there')
}

// sanitizeVisibleReply strips trailing object
{
  const dirty =
    'Would you like me to search online?\n{ "offerWebSearch": { "topic": "jobs", "querySoFar": "jobs" } }'
  assert.equal(sanitizeVisibleReply(dirty), 'Would you like me to search online?')
}

// extractJsonObject from fenced block
{
  const fenced = 'Some text\n```json\n{"reply":"Hi","offerWebSearch":null}\n```'
  const blob = extractJsonObject(fenced)
  assert.ok(blob?.includes('"reply"'))
}

// Prose-only fallback when JSON is unparseable
{
  const prose = 'Happy to help — what city are you in?'
  const parsed = parseStructuredAdvisorJson(prose, messages)
  assert.equal(parsed?.reply, prose)
  assert.equal(parsed?.offerWebSearch, null)
}

// sanitizeVisibleReply extracts reply from pure JSON (fallback path bug fix)
{
  const json = '{"reply":"Hello!","offerWebSearch":null}'
  assert.equal(sanitizeVisibleReply(json), 'Hello!')
  const parsed = parseStructuredAdvisorJson(json, messages)
  assert.equal(parsed?.reply, 'Hello!')
}

// extractVisibleReplyFromModelOutput handles pure JSON envelope
{
  const json = '{"reply":"Nice — happy to help.","offerWebSearch":null}'
  const extracted = extractVisibleReplyFromModelOutput(json, messages)
  assert.equal(extracted?.reply, 'Nice — happy to help.')
}

console.log('structured response tests passed')
