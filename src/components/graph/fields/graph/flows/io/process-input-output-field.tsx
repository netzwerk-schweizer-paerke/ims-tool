'use client'
import { useTranslation } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { useCallback } from 'react'

import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { useGraphField } from '@/components/graph/fields/graph/hooks/use-graph-field'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { ConnectionsType } from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { ToggleSwitch } from '@/components/graph/fields/graph/lib/toggle-switch'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { Xwrapper } from '@/lib/xarrows/src'

type ComponentState = {
  connections: ConnectionsType
  enabled: boolean
  text: string
}

const createInitialState = (): ComponentState => ({
  connections: [
    {
      position: 'right',
      type: 'out',
    },
  ],
  enabled: true,
  text: '',
})

export const ProcessInputOutputField: JSONFieldClientComponent = (props) => {
  const { arrowsContent, arrowSetId, ref, setValue, toggleConnectionType, value } =
    useGraphField<ComponentState>({
      connections: processIoConnections,
      createInitialState,
      props,
    })
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const { handleTextChange, localText } = useTextField(value, setValue)

  const handleToggleEnabled = useCallback(() => {
    if (value) {
      setValue({ ...value, enabled: !value.enabled })
    }
  }, [value, setValue])

  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])

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
            <ToggleSwitch
              ariaLabel={t('common:enableBlock')}
              checked={value?.enabled}
              onChange={handleToggleEnabled}
            />
          </div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
