import { memo } from 'react'

import { NodeButton } from '@/components/graph/fields/graph/components/node-button'

type Props = {
  onClickFn: () => void
}

// Define the component
const ButtonCenterRightComponent: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      className={'absolute right-0 top-1/2 z-10 size-6 -translate-y-1/2 translate-x-1/2'}
      id={'inner-center-right'}>
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

// Define the component
const ButtonBottomCenterComponent: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      className={'absolute bottom-0 right-1/2 z-10 size-6 translate-x-1/2 translate-y-1/2'}
      id={'inner-bottom-center'}>
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

// Define the component
const ButtonCenterLeftComponent: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      className={'absolute left-0 top-1/2 z-10 size-6 -translate-x-1/2 -translate-y-1/2'}
      id={'inner-center-left'}>
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

// Define the component
const ButtonTopCenterComponent: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      className={'absolute left-1/2 top-0 z-10 size-6 -translate-x-1/2 -translate-y-1/2'}
      id={'inner-top-center'}>
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

// Export memoized components
export const ButtonCenterRight = memo(ButtonCenterRightComponent)
export const ButtonBottomCenter = memo(ButtonBottomCenterComponent)
export const ButtonCenterLeft = memo(ButtonCenterLeftComponent)
export const ButtonTopCenter = memo(ButtonTopCenterComponent)
