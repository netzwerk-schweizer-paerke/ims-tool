import type { PayloadRequest } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { type DocumentPreloader } from './document-preloader'
import { processRichTextField } from './process-rich-text'

const DOCUMENT_ID = 5
const ENTITY_ID = 1

type LexicalDocument = { root: { children: LexicalParagraph[] } }
type LexicalParagraph = { children: Record<string, unknown>[] }

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const makeReq = (transactionID: string, findByID: Mock): PayloadRequest =>
  ({ payload: { findByID, logger }, transactionID }) as unknown as PayloadRequest

const documentLink = (children: unknown[] = [{ text: 'Plan', type: 'text' }]) => ({
  root: {
    children: [
      {
        children: [
          {
            children,
            fields: {
              doc: { relationTo: 'documents', value: DOCUMENT_ID },
              linkType: 'internal',
            },
            type: 'link',
          },
        ],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

const firstLink = (content: unknown): Record<string, unknown> => {
  const [paragraph] = (content as LexicalDocument).root.children
  const [link] = paragraph.children
  return link
}

const preloaderWith = (
  cloned: Record<number, number>,
  errors: DocumentPreloader['errors'] = [],
): DocumentPreloader => ({
  clonedDocumentIds: new Map(
    Object.entries(cloned).map(([id, clonedId]) => [Number(id), clonedId]),
  ),
  errors,
  preloadedDocuments: new Map(),
})

const run = (
  req: PayloadRequest,
  documentPreloader: DocumentPreloader,
  content: unknown = documentLink(),
) => processRichTextField(content, req, 11, 'activities', 'de', documentPreloader)

/** Instances live in a static map keyed by transaction id, so every test needs its own key. */
const startedTracker = (transactionID: string) => {
  const tracker = CloneStatisticsTracker.getInstance(transactionID)
  tracker.startEntity(ENTITY_ID)
  return tracker
}

describe('processRichTextField', () => {
  test('points the link at the copy when phase 1 copied the document', async () => {
    const tracker = startedTracker('tx-rich-text-ok')

    const result = await run(makeReq('tx-rich-text-ok', vi.fn()), preloaderWith({ [DOCUMENT_ID]: 900 }))

    expect((firstLink(result.content).fields as { doc: { value: unknown } }).doc.value).toBe(900)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(1)
  })

  // A document phase 1 could not copy is one missing link. The lookup ran no Payload operation,
  // so the transaction is intact, and the link must not keep the source organisation's id.
  test('turns the link into text and records the row when phase 1 could not copy the document', async () => {
    const tracker = startedTracker('tx-rich-text-missing')
    const findByID = vi.fn()
    const preloader = preloaderWith({}, [
      { documentId: DOCUMENT_ID, documentName: 'Plan', error: 'NoSuchKey', fileName: 'plan.pdf' },
    ])

    const result = await run(makeReq('tx-rich-text-missing', findByID), preloader)

    // The shape is lexical's `SerializedTextNode`. A link's string `format` would break the editor.
    expect(firstLink(result.content)).toEqual({
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text: 'Plan',
      type: 'text',
      version: 1,
    })
    expect(findByID).not.toHaveBeenCalled()
    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles).toEqual([
      {
        documentId: DOCUMENT_ID,
        documentName: 'Plan',
        error: 'NoSuchKey',
        fileName: 'plan.pdf',
        usageLocation: 'activities rich text field',
      },
    ])
    expect(tracker.getStatistics(ENTITY_ID).source.documentFilesCount).toBe(1)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(0)
  })

  test('marks the place when the failed link carries no words', async () => {
    startedTracker('tx-rich-text-no-words')

    const result = await run(makeReq('tx-rich-text-no-words', vi.fn()), preloaderWith({}), documentLink([]))

    expect(firstLink(result.content)).toMatchObject({ text: '[Document]', type: 'text' })
  })

  test('records a fallback row for a document phase 1 never reached', async () => {
    const tracker = startedTracker('tx-rich-text-unknown')

    await run(makeReq('tx-rich-text-unknown', vi.fn()), preloaderWith({}))

    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles[0]).toMatchObject({
      documentName: 'Unknown',
      error: 'Document 5 was not copied before the transaction opened',
      fileName: 'Unknown',
    })
  })
})
