import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, test, vi } from 'vitest'

import type { TaskList } from '@/payload-types'

import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { type DocumentPreloader } from './document-preloader'
import { stripTaskList } from './strip-task-list'

const DOCUMENT_ID = 5
const ENTITY_ID = 8
const TARGET_ORG_ID = 11

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

/** No transaction id. The strip helper takes its tracker as a parameter. */
const req = { payload: { logger } } as unknown as PayloadRequest

type LexicalDocument = {
  root: { children: { children: { fields: { doc: { value: unknown } } }[] }[] }
}

const documentLink = () => ({
  root: {
    children: [
      {
        children: [
          {
            children: [{ text: 'Plan', type: 'text', version: 1 }],
            fields: {
              doc: { relationTo: 'documents', value: DOCUMENT_ID },
              linkType: 'internal',
            },
            type: 'link',
            version: 1,
          },
        ],
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const linkedDocumentId = (content: unknown): unknown => {
  const [paragraph] = (content as LexicalDocument).root.children
  const [link] = paragraph.children
  return link.fields.doc.value
}

/**
 * Two fields link the same document, and a file row attaches a third one. Built per test,
 * because the helper writes the cloned id into the link object the source still owns.
 */
const makeSource = (): TaskList =>
  ({
    createdAt: '2026-01-01T00:00:00.000Z',
    description: documentLink(),
    files: [{ document: 3, id: 'row-1' }],
    id: ENTITY_ID,
    items: [{ id: 'item-1', topic: documentLink() }],
    name: 'Liste',
    organisation: 3,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as unknown as TaskList

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

afterEach(() => {
  vi.restoreAllMocks()
})

describe('stripTaskList', () => {
  // The endpoint owns the static map. A strip helper counts on the tracker it receives, so a
  // test constructs one and primes no map.
  test('remaps every link on the injected tracker, with no static map primed', async () => {
    const getInstance = vi.spyOn(CloneStatisticsTracker, 'getInstance')
    const tracker = startedTracker()

    const stripped = await stripTaskList(
      makeSource(),
      req,
      TARGET_ORG_ID,
      'de',
      preloaderWith({ [DOCUMENT_ID]: 900 }),
      tracker,
    )

    expect(getInstance).not.toHaveBeenCalled()
    expect(stripped.organisation).toBe(TARGET_ORG_ID)
    expect('id' in stripped).toBe(false)
    expect(linkedDocumentId(stripped.description)).toBe(900)
    expect(linkedDocumentId(stripped.items?.[0].topic)).toBe(900)
    expect(stripped.files).toEqual([{ document: 3 }])
    // Two fields link one document. The tracker copies it once and counts it once.
    expect(tracker.getStatistics(ENTITY_ID).source.documentFilesCount).toBe(1)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(1)
  })

  test('reports a document phase 1 could not copy on the injected tracker, with the list name', async () => {
    const tracker = startedTracker()

    await stripTaskList(
      makeSource(),
      req,
      TARGET_ORG_ID,
      'de',
      preloaderWith({}, [
        { documentId: DOCUMENT_ID, documentName: 'Plan', error: 'NoSuchKey', fileName: 'plan.pdf' },
      ]),
      tracker,
    )

    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles).toEqual([
      {
        documentId: DOCUMENT_ID,
        documentName: 'Plan',
        error: 'NoSuchKey',
        fileName: 'plan.pdf',
        usageLocation: 'Task List "Liste" rich text field',
      },
    ])
  })
})
