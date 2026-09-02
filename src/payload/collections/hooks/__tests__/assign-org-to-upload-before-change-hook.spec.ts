import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

jest.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: jest.fn(),
}))

const SELECTED_ORG = 18

type HookArgs = {
  collection?: { slug: string }
  context?: Record<string, unknown>
  data: Record<string, unknown>
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
  req: { file: { filename: 'report.pdf' }, user: { selectedOrganisation: SELECTED_ORG } },
})

describe('assignOrgToUploadBeforeChangeHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getIdFromRelation as jest.Mock).mockReturnValue(SELECTED_ORG)
  })

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
    expect(getIdFromRelation).not.toHaveBeenCalled()
  })

  test('reads the target organisation off req.context as well', async () => {
    const args = uploading()
    const result = await invoke({
      ...args,
      req: { ...args.req, context: { targetOrganisationId: 7 } },
    })

    expect(result.prefix).toBe('documents/7')
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
})
