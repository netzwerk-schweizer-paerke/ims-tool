import { trimGraphTextFieldHook } from '@/payload/collections/hooks/trim-graph-text-field-hook'

// The hook reads only `value`; the real FieldHook argument object is far larger.
const invoke = (value: unknown) =>
  (trimGraphTextFieldHook as (a: unknown) => unknown)({ value }) as Record<string, unknown>

const connections = [{ position: 'bottom', type: 'out' }]

describe('trimGraphTextFieldHook', () => {
  test('removes the empty lines a user typed above and below a label', () => {
    const result = invoke({ connections, text: '\n\n  Check the valve  \n\n' })

    expect(result.text).toBe('Check the valve')
  })

  test('keeps the line breaks inside a label', () => {
    const result = invoke({ connections, text: '\nFirst line\nSecond line\n' })

    expect(result.text).toBe('First line\nSecond line')
  })

  test('trims every text key the graph schema declares', () => {
    const result = invoke({
      connections,
      text: ' a ',
      textBottom: ' b ',
      textLeft: ' c ',
      textRight: ' d ',
      textTop: ' e ',
    })

    expect(result).toMatchObject({
      text: 'a',
      textBottom: 'b',
      textLeft: 'c',
      textRight: 'd',
      textTop: 'e',
    })
  })

  test('leaves a label that holds only whitespace as an empty string', () => {
    const result = invoke({ connections, text: '   \n  ' })

    expect(result.text).toBe('')
  })

  test('does not touch the other keys of the graph value', () => {
    const result = invoke({ bottomBoolean: 'true', connections, enabled: true, text: ' a ' })

    expect(result.bottomBoolean).toBe('true')
    expect(result.connections).toBe(connections)
    expect(result.enabled).toBe(true)
  })

  test('returns the same object when no text key needs a trim', () => {
    const value = { connections, text: 'Check the valve' }

    expect(invoke(value)).toBe(value)
  })

  test('passes a missing or non-object value straight through', () => {
    expect(invoke(undefined)).toBeUndefined()
    expect(invoke(null)).toBeNull()
    expect(invoke('a string' as unknown)).toBe('a string')
  })
})
