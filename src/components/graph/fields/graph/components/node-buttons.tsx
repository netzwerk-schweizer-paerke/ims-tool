import { NodeButton } from '@/components/graph/fields/graph/components/node-button'

type Props = {
  onClickFn: () => void
}

export const ButtonCenterRight: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      id={'inner-center-right'}
      className={'absolute right-0 top-1/2 z-10 size-6 -translate-y-1/2 translate-x-1/2'}
    >
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

export const ButtonBottomCenter: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      id={'inner-bottom-center'}
      className={'absolute bottom-0 right-1/2 z-10 size-6 translate-x-1/2 translate-y-1/2'}
    >
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

export const ButtonCenterLeft: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      id={'inner-center-left'}
      className={'absolute left-0 top-1/2 z-10 size-6 -translate-x-1/2 -translate-y-1/2'}
    >
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}

export const ButtonTopCenter: React.FC<Props> = ({ onClickFn }) => {
  return (
    <div
      id={'inner-top-center'}
      className={'absolute left-1/2 top-0 z-10 size-6 -translate-x-1/2 -translate-y-1/2'}
    >
      <NodeButton onClick={onClickFn}></NodeButton>
    </div>
  )
}
