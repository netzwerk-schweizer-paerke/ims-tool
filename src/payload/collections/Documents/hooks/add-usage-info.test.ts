import type { CollectionAfterReadHook, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

import { type DocumentUsage, withoutDocumentUsage } from '@/lib/document-usage'

import { addUsageInfoAfterReadHook } from './add-usage-info'

const ORG_A = 1
const ORG_B = 2
const DOCUMENT_ID = 7

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

// The hook reads the locale codes from the config. A read with `locale: 'all'` answers each
// localized field as an object keyed by these codes.
const config = {
  localization: {
    defaultLocale: 'de',
    locales: [{ code: 'de' }, { code: 'fr' }, { code: 'it' }],
  },
}

/** The two clauses the hook writes, and the `and` that joins them. */
interface Clause {
  and?: Clause[]
  'files.document'?: { equals: number }
  organisation?: { equals: number }
}

interface FindOptions {
  collection: Slug
  disableErrors?: boolean
  limit?: number
  overrideAccess?: boolean
  where?: Clause
}

type HookArgs = Parameters<CollectionAfterReadHook>[0]
type HookResult = Record<string, unknown> & { usageCount?: number; usedIn?: DocumentUsage }

interface Row {
  blocks?: unknown
  description?: unknown
  files?: { document: number }[]
  id: number
  items?: unknown
  name: unknown
  organisation: null | number
}

type Slug = 'activities' | 'task-flows' | 'task-lists'

/** A Lexical document that holds one link node pointing at the document. */
const richTextLinking = (documentId: number, relationTo = 'documents') => ({
  root: {
    children: [
      {
        children: [
          {
            children: [{ text: 'Plan', type: 'text' }],
            fields: { doc: { relationTo, value: { id: documentId } } },
            type: 'link',
          },
        ],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

const matches = (row: Row, where: Clause | undefined): boolean => {
  if (!where) {
    return true
  }

  if (where.and) {
    return where.and.every((clause) => matches(row, clause))
  }

  if (where.organisation) {
    return row.organisation === where.organisation.equals
  }

  if (where['files.document']) {
    const documentId = where['files.document'].equals
    return (row.files ?? []).some((file) => file.document === documentId)
  }

  return true
}

/**
 * A `find` stub that honours the `where` the hook writes. With `visibleOrganisation`, a read
 * with `overrideAccess: false` answers the rows of that organisation only. `totalDocs` counts
 * every match, whatever the `limit`.
 */
const findAnswering = (rows: Partial<Record<Slug, Row[]>>, visibleOrganisation?: number) =>
  vi.fn().mockImplementation(async ({ collection, limit, overrideAccess, where }: FindOptions) => {
    const matching = (rows[collection] ?? []).filter(
      (row) =>
        matches(row, where) &&
        (overrideAccess !== false ||
          visibleOrganisation === undefined ||
          row.organisation === visibleOrganisation),
    )

    return {
      docs: limit === undefined ? matching : matching.slice(0, limit),
      totalDocs: matching.length,
    }
  })

const optionsOf = (find: Mock) => find.mock.calls.map(([options]) => options as FindOptions)

interface InvokeOptions {
  collectionSlug?: string
  context?: Record<string, unknown>
  findMany?: boolean
}

const invoke = (
  doc: Record<string, unknown>,
  find: Mock,
  { collectionSlug = 'documents', context = {}, findMany }: InvokeOptions = {},
): Promise<HookResult> => {
  const req = { context, payload: { config, find, logger } } as unknown as PayloadRequest

  return addUsageInfoAfterReadHook({
    collection: { slug: collectionSlug },
    context,
    doc,
    findMany,
    req,
  } as unknown as HookArgs)
}

const ids = (entries: undefined | { id: number }[]) => (entries ?? []).map((entry) => entry.id)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('addUsageInfoAfterReadHook', () => {
  describe('the scan scope', () => {
    // The Local API bypasses access control, so an unscoped scan names the records of every
    // organisation. The scan is bound to the organisation of the document instead.
    test('names an activity of the document organisation and never one of another organisation', async () => {
      const find = findAnswering({
        activities: [
          {
            description: { fr: richTextLinking(DOCUMENT_ID) },
            id: 10,
            name: { de: 'Fremde Aktivität' },
            organisation: ORG_B,
          },
          {
            description: { de: richTextLinking(DOCUMENT_ID) },
            id: 11,
            name: { de: 'Eigene Aktivität' },
            organisation: ORG_A,
          },
        ],
      })

      const result = await invoke({ id: DOCUMENT_ID, organisation: ORG_A }, find)

      expect(ids(result.usedIn?.activities)).toEqual([11])
      expect(result.usageCount).toBe(1)
    })

    test('binds the task flow and task list scans to a populated organisation as well', async () => {
      const find = findAnswering({
        'task-flows': [
          { description: richTextLinking(DOCUMENT_ID), id: 20, name: 'Fremd', organisation: ORG_B },
          { description: richTextLinking(DOCUMENT_ID), id: 21, name: 'Eigen', organisation: ORG_A },
        ],
        'task-lists': [
          { files: [{ document: DOCUMENT_ID }], id: 30, name: 'Fremd', organisation: ORG_B },
          { files: [{ document: DOCUMENT_ID }], id: 31, name: 'Eigen', organisation: ORG_A },
        ],
      })

      const result = await invoke(
        { id: DOCUMENT_ID, organisation: { id: ORG_A, name: 'Park A' } },
        find,
      )

      expect(ids(result.usedIn?.taskFlows)).toEqual([21])
      expect(ids(result.usedIn?.taskLists)).toEqual([31])
    })

    // A `documents-public` row names no organisation, so no organisation can own its references.
    // The scan then hands the bound to the caller's read access rule. The stub applies no access
    // rule, so the test pins the options and not the rows: `overrideAccess: false` lets the rule
    // run, and `disableErrors` turns a denied rule into an empty page instead of a throw.
    test('scans a document without an organisation through the caller access rule', async () => {
      const find = findAnswering({
        activities: [
          {
            description: { de: richTextLinking(DOCUMENT_ID, 'documents-public') },
            id: 10,
            name: { de: 'Aktivität' },
            organisation: ORG_A,
          },
        ],
      })

      const result = await invoke({ id: DOCUMENT_ID }, find, { collectionSlug: 'documents-public' })

      const bound = optionsOf(find).filter((options) => options.overrideAccess === false)
      expect(bound).toHaveLength(3)
      for (const options of bound) {
        expect(options.disableErrors).toBe(true)
        expect(options.where).toBeUndefined()
      }
      expect(ids(result.usedIn?.activities)).toEqual([10])
    })
  })

  describe('the count of references outside the caller access', () => {
    test('is absent when the scan is bound to the document organisation', async () => {
      const find = findAnswering({
        activities: [
          {
            description: { de: richTextLinking(DOCUMENT_ID) },
            id: 10,
            name: { de: 'Eigene' },
            organisation: ORG_A,
          },
          {
            description: { de: richTextLinking(DOCUMENT_ID) },
            id: 20,
            name: { de: 'Fremde' },
            organisation: ORG_B,
          },
        ],
      })

      const result = await invoke({ id: DOCUMENT_ID, organisation: ORG_A }, find)

      expect(result.usedIn?.hiddenReferenceCount).toBeUndefined()
      // Three file reads and three walks. No second pass runs on a complete list.
      expect(find).toHaveBeenCalledTimes(6)
    })

    test('is a bare number, and nothing of a hidden row reaches the value', async () => {
      const find = findAnswering(
        {
          activities: [
            {
              description: { de: richTextLinking(DOCUMENT_ID, 'documents-public') },
              id: 10,
              name: { de: 'Eigene Aktivität' },
              organisation: ORG_A,
            },
            {
              description: { fr: richTextLinking(DOCUMENT_ID, 'documents-public') },
              id: 20,
              name: { de: 'Fremde Aktivität' },
              organisation: ORG_B,
            },
          ],
          'task-flows': [
            {
              description: richTextLinking(DOCUMENT_ID, 'documents-public'),
              id: 30,
              name: 'Fremder Ablauf',
              organisation: ORG_B,
            },
          ],
        },
        ORG_A,
      )

      const result = await invoke({ id: DOCUMENT_ID }, find, { collectionSlug: 'documents-public' })

      expect(ids(result.usedIn?.activities)).toEqual([10])
      expect(result.usedIn?.hiddenReferenceCount).toBe(2)
      expect(result.usageCount).toBe(1)
      const serialized = JSON.stringify(result)
      expect(serialized).not.toContain('Fremd')
      expect(serialized).not.toContain('"id":20')
      expect(serialized).not.toContain('"id":30')
      // Three reads through the caller's access, then three over every organisation.
      expect(optionsOf(find).map((options) => options.overrideAccess)).toEqual([
        false,
        false,
        false,
        true,
        true,
        true,
      ])
    })

    test('counts an attachment through totalDocs and walks only the rows without one', async () => {
      const find = findAnswering(
        {
          activities: [
            { files: [{ document: DOCUMENT_ID }], id: 10, name: { de: 'Eigene' }, organisation: ORG_A },
            { files: [{ document: DOCUMENT_ID }], id: 20, name: { de: 'Fremde' }, organisation: ORG_B },
            {
              description: { de: richTextLinking(DOCUMENT_ID) },
              id: 21,
              name: { de: 'Fremde' },
              organisation: ORG_B,
            },
          ],
        },
        ORG_A,
      )

      const result = await invoke({ id: DOCUMENT_ID }, find)

      expect(ids(result.usedIn?.activities)).toEqual([10])
      // Two attachments from `totalDocs`, one link from the walk, one of them visible.
      expect(result.usedIn?.hiddenReferenceCount).toBe(2)
      expect(optionsOf(find)).toContainEqual(
        expect.objectContaining({
          collection: 'activities',
          limit: 1,
          overrideAccess: true,
          where: { 'files.document': { equals: DOCUMENT_ID } },
        }),
      )
    })

    test('runs no query when the context carries the flag', async () => {
      const find = findAnswering(
        {
          activities: [
            {
              description: { de: richTextLinking(DOCUMENT_ID, 'documents-public') },
              id: 20,
              name: { de: 'Fremde' },
              organisation: ORG_B,
            },
          ],
        },
        ORG_A,
      )
      const doc = { id: DOCUMENT_ID }

      const result = await invoke(doc, find, {
        collectionSlug: 'documents-public',
        context: { skipDocumentUsage: true },
      })

      expect(result).toBe(doc)
      expect(find).not.toHaveBeenCalled()
    })
  })

  describe('the opt-out', () => {
    test('returns the document unchanged and runs no scan when the context carries the flag', async () => {
      const find = findAnswering({
        activities: [
          {
            description: { de: richTextLinking(DOCUMENT_ID) },
            id: 10,
            name: { de: 'Aktivität' },
            organisation: ORG_A,
          },
        ],
      })
      const doc = { id: DOCUMENT_ID, organisation: ORG_A }

      const result = await invoke(doc, find, { context: { skipDocumentUsage: true } })

      expect(result).toBe(doc)
      expect(find).not.toHaveBeenCalled()
    })

    test('accepts the flag from withoutDocumentUsage', async () => {
      const find = findAnswering({})
      const doc = { id: DOCUMENT_ID, organisation: ORG_A }
      const req = withoutDocumentUsage({ context: {} } as unknown as PayloadRequest)

      const result = await invoke(doc, find, { context: req.context })

      expect(result).toBe(doc)
      expect(find).not.toHaveBeenCalled()
    })
  })

  test('runs no scan for a list view', async () => {
    const find = findAnswering({})
    const doc = { id: DOCUMENT_ID, organisation: ORG_A }

    const result = await invoke(doc, find, { findMany: true })

    expect(result).toBe(doc)
    expect(find).not.toHaveBeenCalled()
  })

  // The control for the two tests above: without the flag and outside a list view, the scans
  // run and the sidebar gets its data.
  test('scans and fills usedIn on a single read without the flag', async () => {
    const find = findAnswering({
      activities: [
        { files: [{ document: DOCUMENT_ID }], id: 10, name: { de: 'Aktivität' }, organisation: ORG_A },
      ],
      'task-flows': [
        {
          description: { de: richTextLinking(DOCUMENT_ID) },
          id: 20,
          name: { de: 'Ablauf' },
          organisation: ORG_A,
        },
      ],
      'task-lists': [
        {
          id: 30,
          items: { de: [{ content: richTextLinking(DOCUMENT_ID) }] },
          name: { de: 'Liste' },
          organisation: ORG_A,
        },
      ],
    })

    const result = await invoke({ id: DOCUMENT_ID, organisation: ORG_A }, find)

    expect(find).toHaveBeenCalledTimes(6)
    expect(result.usageCount).toBe(3)
    expect(result.usedIn).toEqual({
      activities: [
        { field: 'files', id: 10, name: 'Aktivität', path: 'files.document', referenceType: 'file' },
      ],
      taskFlows: [
        {
          field: 'description',
          id: 20,
          locale: 'de',
          name: 'Ablauf',
          path: 'description.de',
          referenceType: 'richtext',
        },
      ],
      taskLists: [
        {
          field: 'items',
          id: 30,
          itemIndex: 0,
          locale: 'de',
          name: 'Liste',
          path: 'items.de[0]',
          referenceType: 'richtext',
        },
      ],
    })
  })

  describe('the path format', () => {
    // One walk serves the three collections, so the same hit reads the same everywhere. The
    // clone report copies this path into `usageLocation`.
    test('reports a French-only description the same way for an activity, a task flow and a task list', async () => {
      const description = { fr: richTextLinking(DOCUMENT_ID) }
      const find = findAnswering({
        activities: [{ description, id: 10, name: { fr: 'Activité' }, organisation: ORG_A }],
        'task-flows': [{ description, id: 20, name: { fr: 'Flux' }, organisation: ORG_A }],
        'task-lists': [{ description, id: 30, name: { fr: 'Liste' }, organisation: ORG_A }],
      })

      const result = await invoke({ id: DOCUMENT_ID, organisation: ORG_A }, find)

      const expected = {
        field: 'description',
        locale: 'fr',
        path: 'description.fr',
        referenceType: 'richtext',
      }
      expect(result.usedIn?.activities).toEqual([{ ...expected, id: 10, name: 'Activité' }])
      expect(result.usedIn?.taskFlows).toEqual([{ ...expected, id: 20, name: 'Flux' }])
      expect(result.usedIn?.taskLists).toEqual([{ ...expected, id: 30, name: 'Liste' }])
    })

    test('reports a description that is not localized as `description` without a locale', async () => {
      const find = findAnswering({
        'task-flows': [
          { description: richTextLinking(DOCUMENT_ID), id: 20, name: 'Flow', organisation: ORG_A },
        ],
      })

      const result = await invoke({ id: DOCUMENT_ID, organisation: ORG_A }, find)

      expect(result.usedIn?.taskFlows).toEqual([
        { field: 'description', id: 20, name: 'Flow', path: 'description', referenceType: 'richtext' },
      ])
    })
  })
})
