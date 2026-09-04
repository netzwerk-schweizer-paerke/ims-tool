import type { Field } from 'payload'

import { describe, expect, test } from 'vitest'

import { collectRichTextValues } from '@/lib/collect-rich-text-values'
import { Activities } from '@/payload/collections/Activities'
import { TaskFlows } from '@/payload/collections/TaskFlow'
import { TaskLists } from '@/payload/collections/TaskList'

const lexical = { root: { children: [], type: 'root' } }

const activityDoc = {
  blocks: {
    de: [
      {
        blockType: 'activity-task',
        infos: { norms: lexical, support: lexical },
        io: { input: lexical, output: lexical },
      },
    ],
  },
  description: { de: lexical },
}

const flowDoc = {
  blocks: {
    de: [
      {
        blockType: 'proc-task-io',
        keypoints: { keypoints: lexical },
        responsibility: { responsibility: lexical },
        tools: { tools: lexical },
      },
    ],
  },
  description: { de: lexical },
}

const listDoc = {
  description: { de: lexical },
  items: { de: [{ responsibility: lexical, tools: lexical, topic: lexical }] },
}

const pathsOf = (fields: Field[], data: unknown) =>
  collectRichTextValues(fields, data).map((entry) => entry.path)

describe('collectRichTextValues, against the real collection configs', () => {
  test('finds the description and the four tab fields of an activity block', () => {
    expect(pathsOf(Activities.fields, activityDoc)).toEqual([
      'description',
      'blocks[0].io.input',
      'blocks[0].io.output',
      'blocks[0].infos.norms',
      'blocks[0].infos.support',
    ])
  })

  test('finds the description and the three tab fields of a task-flow block', () => {
    expect(pathsOf(TaskFlows.fields, flowDoc)).toEqual([
      'description',
      'blocks[0].keypoints.keypoints',
      'blocks[0].tools.tools',
      'blocks[0].responsibility.responsibility',
    ])
  })

  test('finds the description and the three fields of a task-list item', () => {
    expect(pathsOf(TaskLists.fields, listDoc)).toEqual([
      'description',
      'items[0].topic',
      'items[0].tools',
      'items[0].responsibility',
    ])
  })

  test('reaches all 13 richText fields the three collections declare', () => {
    const total =
      pathsOf(Activities.fields, activityDoc).length +
      pathsOf(TaskFlows.fields, flowDoc).length +
      pathsOf(TaskLists.fields, listDoc).length

    expect(total).toBe(13)
  })
})

describe('collectRichTextValues, locale handling', () => {
  test('splits a locale map and stamps each entry with its locale', () => {
    const found = collectRichTextValues(Activities.fields, {
      description: { de: lexical, fr: 'plain string' },
    })

    expect(found).toEqual([
      { locale: 'de', path: 'description', value: lexical },
      { locale: 'fr', path: 'description', value: 'plain string' },
    ])
  })

  test('carries the locale of a localized array into its rows', () => {
    const found = collectRichTextValues(TaskLists.fields, {
      items: { fr: [{ topic: 'plain string' }] },
    })

    expect(found).toEqual([{ locale: 'fr', path: 'items[0].topic', value: 'plain string' }])
  })

  test('skips an absent field, because it is empty and not malformed', () => {
    expect(collectRichTextValues(Activities.fields, {})).toEqual([])
    expect(collectRichTextValues(Activities.fields, null)).toEqual([])
    expect(collectRichTextValues(Activities.fields, { description: { de: null } })).toEqual([])
  })
})
