export type AdvisorDocumentType = 'resume'

export type AdvisorMessageMeta = {
  kind?: 'document'
  documentType?: AdvisorDocumentType
}

/** Parse a server-provided document type flag. */
export function parseAdvisorDocumentType(value: unknown): AdvisorDocumentType | undefined {
  return value === 'resume' ? 'resume' : undefined
}

/** Build durable client metadata from server flag and/or local resume expectation. */
export function resolveAdvisorMessageMeta(options: {
  documentType?: string | null
  expectResume?: boolean
}): AdvisorMessageMeta {
  const fromServer = parseAdvisorDocumentType(options.documentType)
  const isResume = fromServer === 'resume' || Boolean(options.expectResume)
  if (!isResume) return {}
  return { kind: 'document', documentType: 'resume' }
}

/** Whether an advisor message should use the resume preview component. */
export function shouldRenderResumePreview(message: {
  kind?: 'document'
  documentType?: AdvisorDocumentType
}): boolean {
  return message.documentType === 'resume' || message.kind === 'document'
}

/** Merge resolved metadata onto an advisor chat message. */
export function withAdvisorMessageMeta<T extends { text: string }>(
  message: T,
  meta: AdvisorMessageMeta,
): T & AdvisorMessageMeta {
  if (!meta.documentType) return message
  return { ...message, kind: 'document', documentType: meta.documentType }
}
