'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { Xwrapper } from '@/lib/xarrows/src'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

type ComponentState = {
  connections: ConnectionsType
  textLeft: string
  textRight: string
}

const initialState: ComponentState = {
  connections: [
    {
      position: 'top',
      type: 'in',
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
  textLeft: '',
  textRight: '',
}

export const ProcessTaskParallelField: JSONFieldClientComponent = (props) => {
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

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: processTaskParallelConnections,
  })

  const setTextLeft = (text: string) => {
    setValue({ ...value, textLeft: text })
  }

  const setTextRight = (text: string) => {
    setValue({ ...value, textRight: text })
  }

  return (
    <div ref={ref} className={'process-task-parallel-block relative h-full'}>
      <Xwrapper>
        <div className={'grid size-full grid-cols-2'}>
          <BlockTaskWrapper>
            <RootTarget id={arrowSetId} comboTarget={'left'}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => setTextLeft(e.target.value)}
                  value={value?.textLeft}
                />
              </TaskShapeWrapper>
            </RootTarget>
          </BlockTaskWrapper>
          <BlockTaskWrapper>
            <RootTarget id={arrowSetId} comboTarget={'right'}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => setTextRight(e.target.value)}
                  value={value?.textRight}
                />
                <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              </TaskShapeWrapper>
            </RootTarget>
            <OuterTargets id={arrowSetId} />
          </BlockTaskWrapper>
        </div>
        <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
      </Xwrapper>
    </div>
  )
}
