'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * A hook for managing text field state with debounced updates to the parent state
 * This reduces re-renders by maintaining a local state that only updates the parent
 * state when necessary.
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
  fieldName: keyof T = 'text' as keyof T
) {
  // Use local state to reduce re-renders
  const [localText, setLocalText] = useState(initialText)

  // Sync local state with parent value
  useEffect(() => {
    if (!value) {
      return
    } else if (value[fieldName] !== localText) {
      // Only update local text if it differs from the field value
      setLocalText((value[fieldName] as string) || '')
    }
  }, [value, localText, fieldName])

  // Debounced text update handler
  const handleTextChange = useCallback(
    (text: string) => {
      setLocalText(text)
      // Only update the actual value when necessary
      if (value && text !== value[fieldName]) {
        setValue({ ...value, [fieldName]: text })
      }
    },
    [value, setValue, fieldName]
  )

  return {
    localText,
    handleTextChange
  }
}

export default useTextField
