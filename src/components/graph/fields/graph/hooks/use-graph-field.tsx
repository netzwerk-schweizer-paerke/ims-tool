'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientProps, Validate } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'

import { useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import {
  ConnectionDefinition,
  ConnectionStateType,
} from '@/components/graph/fields/graph/lib/connection-types'

type Args<TState extends ConnectionStateType> = {
  connections: readonly ConnectionDefinition[]
  /** Must be a factory — a shared object would be handed to every block of this type. */
  createInitialState: () => TState
  props: JSONFieldClientProps
}

/**
 * The wiring every graph JSON field repeats: validation, form state, the one-time default,
 * and the arrow set. Fields keep their own shape wrapper, buttons and text handling.
 */
export const useGraphField = <TState extends ConnectionStateType>({
  connections,
  createInitialState,
  props,
}: Args<TState>) => {
  const {
    field: { required },
    path,
    validate,
  } = props

  // Payload declares two validate types that do not compose. `useField` accepts `Validate`, which
  // erases the field config to `object`. `props.validate` is the JSON field validator, whose
  // options require that config. Payload passes the full options at run time, so the cast holds.
  const memoizedValidate = useCallback<Validate>(
    (value, options) => {
      if (typeof validate !== 'function') {
        return true // Validation passes when no validate function is provided
      }
      return (validate as Validate)(value, { ...options, required })
    },
    [validate, required],
  )

  const { setValue, value } = useField<TState>({ path, validate: memoizedValidate })

  useEffect(() => {
    if (!value) {
      // `true` keeps the form clean — applying a default is not a user edit
      setValue(createInitialState(), true)
    }
  }, [setValue, value, createInitialState])

  const { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType } = useArrows({
    connections,
    setState: setValue,
    state: value,
  })

  const arrowsContent = useMemo(() => (isLoaded ? renderArrows() : null), [isLoaded, renderArrows])

  return { arrowsContent, arrowSetId, ref, setValue, toggleConnectionType, value }
}

export default useGraphField
