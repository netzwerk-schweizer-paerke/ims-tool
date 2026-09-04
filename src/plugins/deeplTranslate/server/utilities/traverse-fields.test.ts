import type { Field } from 'payload'
import type { Mock } from 'vitest'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { logger } from '@/lib/logger'
import { traverseFields } from '@/plugins/deeplTranslate/server/utilities/traverse-fields'

import type { ValueToTranslate } from '../types'

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

const warn = logger.warn as unknown as Mock

// A richText field needs no editor at run time, because traverseFields reads only the value.
const fields = [{ localized: true, name: 'description', type: 'richText' }] as Field[]

const lexical = (text: string) => ({
  root: {
    children: [{ children: [{ text, type: 'text' }], type: 'paragraph' }],
    type: 'root',
  },
})

const run = (value: unknown) => {
  const valuesToTranslate: ValueToTranslate[] = []
  const translatedData: Record<string, unknown> = {}

  traverseFields({
    dataFrom: { description: value },
    fields,
    translatedData,
    valuesToTranslate,
  })

  return { translatedData, valuesToTranslate }
}

describe('traverseFields, richText field', () => {
  beforeEach(() => {
    warn.mockClear()
  })

  test('collects the text of a Lexical value', () => {
    const { valuesToTranslate } = run(lexical('Die Sicherheit gewährleisten.'))

    expect(valuesToTranslate.map((entry) => entry.value)).toEqual(['Die Sicherheit gewährleisten.'])
  })

  test('skips a plain string instead of throwing', () => {
    expect(() => run('Die Sicherheit gewährleisten.')).not.toThrow()
  })

  test('writes nothing and translates nothing for a plain string', () => {
    const { translatedData, valuesToTranslate } = run('Die Sicherheit gewährleisten.')

    expect(valuesToTranslate).toEqual([])
    expect(translatedData.description).toBeUndefined()
  })

  test('logs a warning that names the field and the value type', () => {
    run('Die Sicherheit gewährleisten.')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatchObject({
      fieldName: 'description',
      valueType: 'string',
    })
  })

  test('skips a number without throwing', () => {
    expect(() => run(42)).not.toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
  })

  test('skips a Slate array quietly, because it is an object without a root', () => {
    const { valuesToTranslate } = run([{ children: [{ text: 'a' }], type: 'paragraph' }])

    expect(valuesToTranslate).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  test('leaves a null value to the earlier empty check', () => {
    const { valuesToTranslate } = run(null)

    expect(valuesToTranslate).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })
})
