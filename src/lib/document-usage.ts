import type { PayloadRequest } from 'payload'

/**
 * The shape that `addUsageInfoAfterReadHook` writes into the virtual `usedIn` field.
 * The hook runs on the server and `DocumentUsageField` renders the value on the client,
 * so the contract between them lives here.
 */
export interface DocumentUsage {
  activities: DocumentUsageReference[]
  /**
   * The references the caller's read access hides, as a bare number. It is present only when
   * the scan was bound to the caller's access instead of the document's organisation, which is
   * every `documents-public` row. No id, name or path of a hidden row ever accompanies it.
   */
  hiddenReferenceCount?: number
  taskFlows: DocumentUsageReference[]
  taskLists: DocumentUsageReference[]
}

export interface DocumentUsageReference {
  blockId?: string
  blockType?: string
  /** The field that holds the reference, such as `files`, `description` or `io`. */
  field?: string
  id: number
  itemIndex?: number
  locale?: string
  name: string
  /** The dotted path to the reference. It is diagnostic only and the admin never shows it. */
  path?: string
  referenceType: string
}

/**
 * The `req.context` key that turns `addUsageInfoAfterReadHook` off for one request.
 *
 * Every single-document read, create and delete of a `documents` row runs three scans at depth 2.
 * An internal caller that handles the row for its own purpose, such as the clone and the legacy
 * fetcher, sets this key. The hook then returns the document unchanged.
 */
export const SKIP_DOCUMENT_USAGE_CONTEXT_KEY = 'skipDocumentUsage'

/** A copy of the request that carries the opt-out. The request it was made from stays as it was. */
export const withoutDocumentUsage = (req: PayloadRequest): PayloadRequest => ({
  ...req,
  context: { ...req.context, [SKIP_DOCUMENT_USAGE_CONTEXT_KEY]: true },
})
