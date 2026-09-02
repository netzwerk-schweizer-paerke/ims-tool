/**
 * The shape that `addUsageInfoAfterReadHook` writes into the virtual `usedIn` field.
 * The hook runs on the server and `DocumentUsageField` renders the value on the client,
 * so the contract between them lives here.
 */
export interface DocumentUsage {
  activities: DocumentUsageReference[]
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
