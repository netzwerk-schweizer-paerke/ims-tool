'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { activityTaskConnections } from './connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { Xwrapper } from '@/lib/xarrows/src'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

type ComponentState = {
  connections: ConnectionsType
  text: string
}

const initialState: ComponentState = {
  connections: [
    {
      position: 'top',
      type: 'none',
    },
    {
      position: 'right',
      type: 'none',
    },
    {
      position: 'bottom',
      type: 'out',
    },
  ],
  text: '',
}

export const ActivityTaskField: JSONFieldClientComponent = (props) => {
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
    connections: activityTaskConnections,
  })

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          <RootTarget id={arrowSetId}>
            <TaskShapeWrapper mode={'edit'}>
              <textarea
                className={
                  'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                }
                onChange={(e) => setText(e.target.value)}
                value={value?.text}
              />
              <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              <ButtonBottomCenter onClickFn={() => toggleConnectionType('bottom')} />
              <ButtonTopCenter onClickFn={() => toggleConnectionType('top')} />
            </TaskShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
