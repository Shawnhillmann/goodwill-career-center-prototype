import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import type { ChatMessage } from './advisorPrompt'
import { getEnv, requireEnv } from './env'

type BedrockProvider = 'anthropic' | 'nova'

function isNovaModelId(modelId: string): boolean {
  if (modelId.startsWith('amazon.nova')) return true
  return (
    modelId.startsWith('us.amazon.nova') ||
    modelId.startsWith('eu.amazon.nova') ||
    modelId.startsWith('global.amazon.nova')
  )
}

function detectBedrockProvider(modelId: string): BedrockProvider | null {
  if (
    modelId.startsWith('anthropic.') ||
    modelId.startsWith('us.anthropic.') ||
    modelId.startsWith('global.anthropic.')
  ) {
    return 'anthropic'
  }
  if (isNovaModelId(modelId)) {
    return 'nova'
  }
  return null
}

export function novaInferenceProfileHint(modelId: string): string | undefined {
  if (!modelId.startsWith('amazon.nova')) return undefined
  const suffix = modelId.slice('amazon.'.length)
  return `Use the inference profile id instead, e.g. us.${ suffix } (set BEDROCK_MODEL_ID in .env and restart the server).`
}

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: [{ type: 'text', text: m.content }],
  }))
}

function toNovaMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }))
}

function parseNovaResponse(json: unknown): string {
  const content = (json as { output?: { message?: { content?: unknown } } })?.output?.message?.content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block): block is { text: string } => Boolean(block && typeof (block as { text?: string }).text === 'string'))
    .map((block) => block.text)
    .join('')
}

function createBedrockClient(region: string, credentials?: { accessKeyId: string; secretAccessKey: string }) {
  return new BedrockRuntimeClient({
    region,
    credentials,
  })
}

async function invokeAnthropicViaBedrock(params: {
  client: BedrockRuntimeClient
  modelId: string
  system: string
  messages: ChatMessage[]
}) {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 800,
    temperature: 0.4,
    system: params.system,
    messages: toAnthropicMessages(params.messages),
  }

  const cmd = new InvokeModelCommand({
    modelId: params.modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(JSON.stringify(body)),
  })

  const resp = await params.client.send(cmd)
  const text = new TextDecoder().decode(resp.body)
  const json = JSON.parse(text) as { content?: Array<{ type?: string; text?: string }> }
  return Array.isArray(json?.content) && json.content[0]?.type === 'text' ? String(json.content[0].text ?? '') : ''
}

async function invokeNovaViaBedrock(params: {
  client: BedrockRuntimeClient
  modelId: string
  system: string
  messages: ChatMessage[]
}) {
  const body: Record<string, unknown> = {
    system: [{ text: params.system }],
    messages: toNovaMessages(params.messages),
    inferenceConfig: {
      maxTokens: 300,
      temperature: 0.4,
      topP: 0.9,
    },
  }

  if (!params.modelId.includes('nova-2')) {
    body.schemaVersion = 'messages-v1'
  }

  const cmd = new InvokeModelCommand({
    modelId: params.modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(JSON.stringify(body)),
  })

  const resp = await params.client.send(cmd)
  const text = new TextDecoder().decode(resp.body)
  const json = JSON.parse(text)
  return parseNovaResponse(json)
}

export async function invokeBedrockChat(params: { system: string; messages: ChatMessage[] }): Promise<string> {
  const env = requireEnv('AWS_REGION', 'BEDROCK_MODEL_ID')
  const fullEnv = getEnv()
  const modelId = env.BEDROCK_MODEL_ID
  const bedrockProvider = detectBedrockProvider(modelId)

  if (!bedrockProvider) {
    throw new Error(
      `BEDROCK_MODEL_ID (${ modelId }) is not supported. Use an Anthropic Claude id (anthropic.*, us.anthropic.*, global.anthropic.*) or an Amazon Nova id (us.amazon.nova*, eu.amazon.nova*, global.amazon.nova*, or amazon.nova* where on-demand is enabled).`,
    )
  }

  const credentials =
    fullEnv.AWS_ACCESS_KEY_ID && fullEnv.AWS_SECRET_ACCESS_KEY
      ? { accessKeyId: fullEnv.AWS_ACCESS_KEY_ID, secretAccessKey: fullEnv.AWS_SECRET_ACCESS_KEY }
      : undefined

  const client = createBedrockClient(env.AWS_REGION, credentials)

  return bedrockProvider === 'anthropic'
    ? invokeAnthropicViaBedrock({ client, modelId, system: params.system, messages: params.messages })
    : invokeNovaViaBedrock({ client, modelId, system: params.system, messages: params.messages })
}

export function bedrockErrorHint(err: unknown, modelId: string): string | undefined {
  const errMessage = String((err as { message?: string })?.message ?? '')
  if ((err as { name?: string })?.name === 'AccessDeniedException') {
    return 'Check IAM permissions (bedrock:InvokeModel, bedrock:UseInferenceProfile) and Bedrock model access in the AWS Console.'
  }
  if (errMessage.includes('on-demand throughput') || errMessage.includes('inference profile')) {
    return novaInferenceProfileHint(modelId) ?? errMessage
  }
  return errMessage || undefined
}
