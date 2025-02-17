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
import { useCallback, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

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

  const memoizedValidate: any = useCallback(
    (value: any, options: any) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { value, setValue } = useField<ComponentState>({ path, validate: memoizedValidate })

  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  const setText = (text: string) => {
    setValue({ ...value, text })
  }

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: processIoConnections,
  })

  const toggleEnabled = () => {
    setValue({ ...value, enabled: !value.enabled })
  }

  return (
    <div ref={ref} className={'process-task-io-block relative h-full'}>
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
                    onChange={(e) => setText(e.target.value)}
                    value={value?.text}
                  />
                  <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
                </IOShapeWrapper>
              </RootTarget>
              <OuterTargets id={arrowSetId} />
              <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
            </>
          )}
          <div className={'absolute right-1/2 top-0 translate-x-1/2'}>
            <ToggleSwitch checked={value?.enabled} onChange={toggleEnabled} />
          </div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
