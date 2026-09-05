import type { PayloadRequest, TypedLocale } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

import type { Activity } from '@/payload-types'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'

import { cloneActivity } from './clone-activity'

const SOURCE_ID = 5
const CLONE_ID = 55
const TARGET_ORG_ID = 11
const DE_DOCUMENT_ID = 243
const FR_DOCUMENT_ID = 244
const DE_COPY_ID = 900
const FR_COPY_ID = 901

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

/**
 * The source once per locale, with the fallback off. `files` is one array for every locale, so
 * each locale shows the same row, with that locale's document. Italian has no content.
 */
const sourcesByLocale = new Map<TypedLocale, Activity>([
  [
    'de',
    {
      files: [{ document: DE_DOCUMENT_ID, id: 'source-row' }],
      id: SOURCE_ID,
      name: 'Quelle',
      organisation: 3,
      variant: 'standard',
    } as unknown as Activity,
  ],
  [
    'fr',
    {
      files: [{ document: FR_DOCUMENT_ID, id: 'source-row' }],
      id: SOURCE_ID,
      name: 'Source',
      organisation: 3,
      variant: 'standard',
    } as unknown as Activity,
  ],
  ['it', { files: [{ id: 'source-row' }], id: SOURCE_ID } as unknown as Activity],
])

const makeReq = () => {
  const create = vi.fn().mockResolvedValue({ id: CLONE_ID, name: 'Quelle' })
  const update = vi.fn().mockResolvedValue({ id: CLONE_ID, name: 'Quelle' })
  const req = { context: {}, payload: { create, logger, update } } as unknown as PayloadRequest

  return { create, req, update }
}

const preloader = (): DocumentPreloader => ({
  clonedDocumentIds: new Map([
    [DE_DOCUMENT_ID, DE_COPY_ID],
    [FR_DOCUMENT_ID, FR_COPY_ID],
  ]),
  errors: [],
  preloadedDocuments: new Map(),
})

const run = (req: PayloadRequest) => {
  const tracker = new CloneStatisticsTracker()
  tracker.startEntity(SOURCE_ID)

  return cloneActivity({
    documentPreloader: preloader(),
    locales: ['de', 'fr', 'it'],
    req,
    sourceId: SOURCE_ID,
    sourcesByLocale,
    targetOrgId: TARGET_ORG_ID,
    tracker,
  })
}

type UpdateArgs = { data: { files?: { document?: number; id?: string }[]; name?: string }; id: number; locale: string }

const updates = (update: Mock): UpdateArgs[] =>
  update.mock.calls.map((call) => call[0] as UpdateArgs)

describe('cloneActivity', () => {
  // The source attaches a different document in de and in fr. The clone must carry both copies
  // on the one row the array has, because the row is shared and only `document` is localized.
  test('carries the de and the fr attachment of one row as the two copies', async () => {
    const { req, update } = makeReq()

    await run(req)

    const fileWrites = updates(update).filter((args) => args.data.files !== undefined)
    expect(fileWrites).toEqual([
      expect.objectContaining({
        data: { files: [{ document: DE_COPY_ID, id: expect.any(String) }] },
        locale: 'de',
      }),
      expect.objectContaining({
        data: { files: [{ document: FR_COPY_ID, id: expect.any(String) }] },
        locale: 'fr',
      }),
    ])
    expect(fileWrites[1].data.files?.[0].id).toBe(fileWrites[0].data.files?.[0].id)
  })

  // A `files` write without the clone's row ids replaces every row, and the other locales go
  // with it. The locale update itself therefore carries no `files`.
  test('writes the fr text in its own update, without files rows', async () => {
    const { create, req, update } = makeReq()

    await run(req)

    const frTextWrite = updates(update).find(
      (args) => args.locale === 'fr' && args.data.files === undefined,
    )
    expect(frTextWrite).toMatchObject({ data: { name: 'Source' }, id: CLONE_ID })
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0]).toMatchObject({ locale: 'de' })
  })
})
