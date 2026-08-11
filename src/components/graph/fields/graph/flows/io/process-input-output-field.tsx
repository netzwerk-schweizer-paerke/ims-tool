'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'

import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { ToggleSwitch } from '@/components/graph/fields/graph/lib/toggle-switch'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { Xwrapper } from '@/lib/xarrows/src'

type ComponentState = {
  connections: ConnectionsType
  enabled: boolean
  text: string
}

const initialState: ComponentState = {
  connections: [
    {
      position: 'right',
      type: 'out',
    },
  ],
  enabled: true,
  text: '',
}

export const ProcessInputOutputField: JSONFieldClientComponent = (props) => {
  const {
    field: { required },
    path,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value: any, options: any) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
      return true // Validation passes when no validate function is provided
    },
    [validate, required],
  )

  const { setValue, value } = useField<ComponentState>({ path, validate: memoizedValidate })

  // Use the centralized text field hook instead of local implementation
  const { handleTextChange, localText } = useTextField(value, setValue)

  // Initialize state once
  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType } = useArrows({
    connections: processIoConnections,
    setState: setValue,
    state: value,
  })

  // Memoize toggleEnabled handler
  const handleToggleEnabled = useCallback(() => {
    if (value) {
      setValue({ ...value, enabled: !value.enabled })
    }
  }, [value, setValue])

  // Memoize button click handlers
  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])

  // Memoize arrows rendering to prevent recalculation
  const arrowsContent = useMemo(() => {
    return isLoaded ? renderArrows() : null
  }, [isLoaded, renderArrows])

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          {value?.enabled && (
            <>
              <RootTarget id={arrowSetId}>
                <IOShapeWrapper mode={'edit'}>
                  <textarea
                    className={
                      'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                    }
                    onChange={(e) => handleTextChange(e.target.value)}
                    value={localText}
                  />
                  <ButtonCenterRight onClickFn={handleRightClick} />
                </IOShapeWrapper>
              </RootTarget>
              <OuterTargets id={arrowSetId} />
              <div className={'x-arrows'}>{arrowsContent}</div>
            </>
          )}
          <div className="absolute -top-2 w-full text-center">
            <ToggleSwitch checked={value?.enabled} onChange={handleToggleEnabled} />
          </div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
