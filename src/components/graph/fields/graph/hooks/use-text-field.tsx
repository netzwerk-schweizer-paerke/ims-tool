'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
export function useTextField<T extends Record<string, unknown>>(
  value: T | undefined,
  setValue: (value: T) => void,
  initialText: string = '',
  fieldName: keyof T = 'text' as keyof T,
) {
  // What the textarea shows, independent of what the form currently holds
  const [localText, setLocalText] = useState(initialText)

  // The text this hook wrote last. It stays set until the form reports that same text back.
  const pendingWrite = useRef<null | string>(null)

  // Payload can report text older than what the user has typed. The Edit view merges a
  // server form-state response about 250ms after a change, and that response lags the
  // textarea. A rewrite with the older text then sends the caret to the end of the box.
  useEffect(() => {
    if (!value) {
      return
    }
    const incoming = (value[fieldName] as string | undefined) ?? ''
    // Accept an incoming value only after the form catches up with the last local write.
    if (pendingWrite.current !== null) {
      if (incoming !== pendingWrite.current) {
        return
      }
      pendingWrite.current = null
    }
    setLocalText((previous) => (previous === incoming ? previous : incoming))
  }, [value, fieldName])

  const handleTextChange = useCallback(
    (text: string) => {
      setLocalText(text)
      // Only update the actual value when necessary
      if (value && text !== value[fieldName]) {
        pendingWrite.current = text
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
