'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientProps, Validate } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'

import { useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { ArrowLayer } from '@/components/graph/fields/graph/lib/arrow-layer'
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
    readOnly,
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

  const {
    disabled,
    setValue: setFieldValue,
    value,
  } = useField<TState>({ path, validate: memoizedValidate })

  // Payload resolves the field's update access into these two flags. Its own JSON field combines
  // them the same way, at @payloadcms/ui/dist/fields/JSON/index.js:95.
  const isReadOnly = Boolean(readOnly) || disabled

  useEffect(() => {
    if (!value) {
      // `true` keeps the form clean — applying a default is not a user edit. It stays ungated,
      // because a block with no value renders nothing until its default lands.
      setFieldValue(createInitialState(), true)
    }
  }, [setFieldValue, value, createInitialState])

  // Every user edit reaches form state through here, so this one guard covers the label text, the
  // arrow toggles and the boolean buttons. The disabled controls carry the visible affordance.
  const setValue = useCallback(
    (next: unknown, disableModifyingForm?: boolean) => {
      if (isReadOnly) {
        return
      }
      setFieldValue(next, disableModifyingForm)
    },
    [isReadOnly, setFieldValue],
  )

  const { arrows, arrowSetId, toggleConnectionType } = useArrows({
    connections,
    setState: setValue,
    state: value,
  })

  // The layer measures in a layout effect, so the first painted frame already carries the
  // geometry. The old engine needed an `isLoaded` gate because it measured per arrow.
  const arrowsContent = useMemo(() => <ArrowLayer arrows={arrows} />, [arrows])

  return { arrowsContent, arrowSetId, readOnly: isReadOnly, setValue, toggleConnectionType, value }
}

export default useGraphField
