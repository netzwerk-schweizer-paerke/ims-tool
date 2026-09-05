import { describe, expect, test } from 'vitest'

import { assignOrgToUploadBeforeChangeHook } from './assign-org-to-upload-before-change-hook'

const SELECTED_ORG = 18

type HookArgs = {
  collection?: { slug: string }
  context?: Record<string, unknown>
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  req: { context?: Record<string, unknown>; file?: unknown; user?: unknown }
}

const invoke = (args: HookArgs) =>
  // The hook only reads the handful of properties named here; the real
  // BeforeChangeHook argument object is far larger.
  (assignOrgToUploadBeforeChangeHook as (a: unknown) => Promise<Record<string, unknown>>)({
    collection: { slug: 'documents' },
    ...args,
  })

const uploading = (data: Record<string, unknown> = {}): HookArgs => ({
  data: { prefix: 'documents', ...data },
  req: {
    context: {},
    file: { filename: 'report.pdf' },
    user: { roles: [], selectedOrganisation: SELECTED_ORG },
  },
})

describe('assignOrgToUploadBeforeChangeHook', () => {
  test('files a new upload under the acting user’s organisation', async () => {
    const result = await invoke(uploading())

    expect(result.prefix).toBe(`documents/${SELECTED_ORG}`)
  })

  test('uses the collection slug, so each collection gets its own folder', async () => {
    const result = await invoke({
      ...uploading(),
      collection: { slug: 'media' },
    })

    expect(result.prefix).toBe(`media/${SELECTED_ORG}`)
  })

  test('honours the target organisation that cloning puts on the context', async () => {
    const result = await invoke({
      ...uploading(),
      context: { targetOrganisationId: 7 },
    })

    expect(result.prefix).toBe('documents/7')
  })

  test('reads the target organisation off req.context as well', async () => {
    const args = uploading()
    const result = await invoke({
      ...args,
      req: { ...args.req, context: { targetOrganisationId: 7 } },
    })

    expect(result.prefix).toBe('documents/7')
  })

  // A replaced file must not follow the acting user into another park.
  test('keeps a replaced file in the organisation that owns the stored row', async () => {
    const result = await invoke({
      ...uploading(),
      originalDoc: { organisation: 11 },
    })

    expect(result.prefix).toBe('documents/11')
  })

  // PIMS-88: the cloud-storage plugin re-saves the document from its own
  // afterChange hook once the object is in S3, re-entering this hook with the
  // already-prefixed value. Appending again pointed the record at a key that
  // holds no object.
  test('leaves the prefix alone on a save that carries no file', async () => {
    const result = await invoke({
      data: { prefix: `documents/${SELECTED_ORG}` },
      req: { user: { selectedOrganisation: SELECTED_ORG } },
    })

    expect(result.prefix).toBe(`documents/${SELECTED_ORG}`)
  })

  test('does not move a legacy prefix that no longer matches the org', async () => {
    const result = await invoke({
      data: { prefix: 'documents/null' },
      req: { user: { selectedOrganisation: SELECTED_ORG } },
    })

    expect(result.prefix).toBe('documents/null')
  })

  test('is idempotent — re-running over its own output does not grow the prefix', async () => {
    const first = await invoke(uploading())
    const second = await invoke(uploading({ prefix: first.prefix }))

    expect(second.prefix).toBe(first.prefix)
  })

  // 188 rows landed under the literal `documents/null` before this guard existed.
  test('refuses an upload whose organisation does not resolve', async () => {
    const args = uploading()

    await expect(
      invoke({ ...args, req: { ...args.req, user: { roles: [], selectedOrganisation: null } } }),
    ).rejects.toThrow(/no organisation resolved/)
  })
})
