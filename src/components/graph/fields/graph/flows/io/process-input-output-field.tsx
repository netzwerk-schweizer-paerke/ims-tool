'use client'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { Xwrapper } from '@/lib/xarrows/src'
import { ToggleSwitch } from '@/components/graph/fields/graph/lib/toggle-switch'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'
import { useField } from '@payloadcms/ui'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'

type ComponentState = {
  enabled: boolean
  connections: ConnectionsType
  text: string
}

const initialState: ComponentState = {
  enabled: true,
  connections: [
    {
      position: 'right',
      type: 'out',
    },
  ],
  text: '',
}

export const ProcessInputOutputField: JSONFieldClientComponent = (props) => {
  const {
    path,
    validate,
    field: { required },
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

  const { value, setValue } = useField<ComponentState>({ path, validate: memoizedValidate })

  // Use the centralized text field hook instead of local implementation
  const { localText, handleTextChange } = useTextField(value, setValue)

  // Initialize state once
  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: processIoConnections,
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
          <div className="absolute bottom-16 w-full text-center">
            <ToggleSwitch checked={value?.enabled} onChange={handleToggleEnabled} />
          </div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
