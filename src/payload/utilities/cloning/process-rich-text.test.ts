import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, type Mock, test, vi } from 'vitest'

import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { type DocumentPreloader } from './document-preloader'
import { processRichTextField } from './process-rich-text'

const DOCUMENT_ID = 5
const ENTITY_ID = 1

type LexicalDocument = { root: { children: LexicalParagraph[] } }
type LexicalParagraph = { children: Record<string, unknown>[] }

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

/** No transaction id. The helper takes its tracker as a parameter and reads none from a map. */
const makeReq = (findByID: Mock): PayloadRequest =>
  ({ payload: { findByID, logger } }) as unknown as PayloadRequest

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

const startedTracker = () => {
  const tracker = new CloneStatisticsTracker()
  tracker.startEntity(ENTITY_ID)
  return tracker
}

const run = (
  req: PayloadRequest,
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
  content: unknown = documentLink(),
) => processRichTextField(content, req, 11, 'activities', 'de', documentPreloader, tracker)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('processRichTextField', () => {
  // The endpoint owns the static map. A helper counts on the tracker it receives, so a test
  // needs no transaction id and primes no map.
  test('points the link at the copy, on the injected tracker and without the static map', async () => {
    const getInstance = vi.spyOn(CloneStatisticsTracker, 'getInstance')
    const tracker = startedTracker()

    const result = await run(makeReq(vi.fn()), preloaderWith({ [DOCUMENT_ID]: 900 }), tracker)

    expect((firstLink(result.content).fields as { doc: { value: unknown } }).doc.value).toBe(900)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(1)
    expect(getInstance).not.toHaveBeenCalled()
  })

  // A document phase 1 could not copy is one missing link. The lookup ran no Payload operation,
  // so the transaction is intact, and the link must not keep the source organisation's id.
  test('turns the link into text and records the row when phase 1 could not copy the document', async () => {
    const tracker = startedTracker()
    const findByID = vi.fn()
    const preloader = preloaderWith({}, [
      { documentId: DOCUMENT_ID, documentName: 'Plan', error: 'NoSuchKey', fileName: 'plan.pdf' },
    ])

    const result = await run(makeReq(findByID), preloader, tracker)

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
    const result = await run(makeReq(vi.fn()), preloaderWith({}), startedTracker(), documentLink([]))

    expect(firstLink(result.content)).toMatchObject({ text: '[Document]', type: 'text' })
  })

  test('records a fallback row for a document phase 1 never reached', async () => {
    const tracker = startedTracker()

    await run(makeReq(vi.fn()), preloaderWith({}), tracker)

    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles[0]).toMatchObject({
      documentName: 'Unknown',
      error: 'Document 5 was not copied before the transaction opened',
      fileName: 'Unknown',
    })
  })
})
