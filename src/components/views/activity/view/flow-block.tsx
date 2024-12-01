import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { TaskFlow } from '@/payload-types'
import { FlowBlockViewLink } from '@/components/views/activity/view/flow-block-view-link'

type Props = {
  flow: TaskFlow | number
}

export const FlowBlock: React.FC<Props> = ({ flow }) => {
  if (typeof flow === 'number') {
    throw new Error('FlowBlock flow prop should be a TaskFlow object')
  }
  const blockText = flow.name
  return (
    <TaskShapeWrapper>
      <FlowBlockViewLink flowId={flow.id}>{blockText}</FlowBlockViewLink>
    </TaskShapeWrapper>
  )
}
