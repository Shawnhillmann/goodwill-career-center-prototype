import { describe, expect, it } from 'vitest'

import {
  parseAdvisorDocumentType,
  resolveAdvisorMessageMeta,
  shouldRenderResumePreview,
  withAdvisorMessageMeta,
} from './advisorMessage'

describe('resolveAdvisorMessageMeta', () => {
  it('marks resume output from server documentType', () => {
    expect(resolveAdvisorMessageMeta({ documentType: 'resume' })).toEqual({
      kind: 'document',
      documentType: 'resume',
    })
  })

  it('marks resume output when client expects resume', () => {
    expect(resolveAdvisorMessageMeta({ expectResume: true })).toEqual({
      kind: 'document',
      documentType: 'resume',
    })
  })

  it('returns empty metadata for normal assistant replies', () => {
    expect(resolveAdvisorMessageMeta({ documentType: null, expectResume: false })).toEqual({})
  })
})

describe('shouldRenderResumePreview', () => {
  it('renders first resume with document metadata', () => {
    expect(shouldRenderResumePreview({ kind: 'document', documentType: 'resume' })).toBe(true)
  })

  it('renders second resume in the same conversation with document metadata', () => {
    expect(shouldRenderResumePreview({ documentType: 'resume' })).toBe(true)
  })

  it('renders edited or regenerated resume when metadata persists', () => {
    const regenerated = withAdvisorMessageMeta(
      { text: 'JANE DOE\nPROFESSIONAL SUMMARY\nUpdated summary' },
      { kind: 'document', documentType: 'resume' },
    )
    expect(shouldRenderResumePreview(regenerated)).toBe(true)
  })

  it('keeps normal assistant messages on standard chat rendering', () => {
    expect(shouldRenderResumePreview({ kind: undefined, documentType: undefined })).toBe(false)
  })
})

describe('parseAdvisorDocumentType', () => {
  it('accepts only the resume document type', () => {
    expect(parseAdvisorDocumentType('resume')).toBe('resume')
    expect(parseAdvisorDocumentType('cover_letter')).toBeUndefined()
  })
})
