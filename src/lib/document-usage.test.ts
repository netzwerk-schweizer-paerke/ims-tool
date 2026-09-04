import type { PayloadRequest } from 'payload'

import { describe, expect, test } from 'vitest'

import { SKIP_DOCUMENT_USAGE_CONTEXT_KEY, withoutDocumentUsage } from '@/lib/document-usage'

describe('withoutDocumentUsage', () => {
  test('sets the flag on a copy and keeps the other context keys', () => {
    const req = { context: { targetOrganisationId: 11 } } as unknown as PayloadRequest

    const quiet = withoutDocumentUsage(req)

    expect(quiet.context).toEqual({
      [SKIP_DOCUMENT_USAGE_CONTEXT_KEY]: true,
      targetOrganisationId: 11,
    })
    expect(quiet).not.toBe(req)
    expect(req.context).toEqual({ targetOrganisationId: 11 })
  })

  test('creates the context when the request carries none', () => {
    const quiet = withoutDocumentUsage({} as unknown as PayloadRequest)

    expect(quiet.context).toEqual({ skipDocumentUsage: true })
  })
})
