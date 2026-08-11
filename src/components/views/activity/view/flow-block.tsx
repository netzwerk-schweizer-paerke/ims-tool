import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { FlowBlockViewLink } from '@/components/views/activity/view/flow-block-view-link'
import { TaskFlow } from '@/payload-types'

type Props = {
  flow: number | TaskFlow
}

export const FlowBlock: React.FC<Props> = ({ flow }) => {
  if (typeof flow === 'number') {
    throw new TypeError('FlowBlock flow prop should be a TaskFlow object')
  }
  const blockText = flow.name
  return (
    <TaskShapeWrapper>
      <FlowBlockViewLink flowId={flow.id}>{blockText}</FlowBlockViewLink>
    </TaskShapeWrapper>
  )
}
