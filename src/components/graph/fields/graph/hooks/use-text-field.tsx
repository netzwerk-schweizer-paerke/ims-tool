'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Mirrors a text field's value in local state so the textarea keeps its text and caret if
 * the field is re-rendered from the server, and writes straight through to the parent on
 * every change.
 *
 * NOT debounced — every keystroke dispatches to Payload form state. The local mirror does
 * not reduce parent updates; it only decouples what the textarea shows from what the form
 * currently holds.
 *
 * @param value The current field value from the parent component
 * @param setValue Function to update the parent value
 * @param initialText Initial text value (defaults to empty string)
 * @param fieldName The field name in the parent value object (defaults to 'text')
 * @returns An object with the local text value and a change handler
 */
export function useTextField<T extends Record<string, any>>(
  value: T | undefined,
  setValue: (value: T) => void,
  initialText: string = '',
  fieldName: keyof T = 'text' as keyof T,
) {
  // What the textarea shows, independent of what the form currently holds
  const [localText, setLocalText] = useState(initialText)

  // Sync local state with parent value
  useEffect(() => {
    if (!value) {
      return
    }
    if (value[fieldName] !== localText) {
      // Only update local text if it differs from the field value
      setLocalText((value[fieldName] as string) || '')
    }
  }, [value, localText, fieldName])

  const handleTextChange = useCallback(
    (text: string) => {
      setLocalText(text)
      // Only update the actual value when necessary
      if (value && text !== value[fieldName]) {
        setValue({ ...value, [fieldName]: text })
      }
    },
    [value, setValue, fieldName],
  )

  return {
    handleTextChange,
    localText,
  }
}

export default useTextField
