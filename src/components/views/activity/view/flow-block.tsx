import { GraphLabel } from '@/components/graph/graph-label'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { FlowBlockViewLink } from '@/components/views/activity/view/flow-block-view-link'
import { ViewLinks } from '@/components/views/view-links'
import { TaskFlow } from '@/payload-types'

type Props = {
  flow: number | TaskFlow
  links: ViewLinks
}

export const FlowBlock = ({ flow, links }: Props) => {
  if (typeof flow === 'number') {
    throw new TypeError('FlowBlock flow prop should be a TaskFlow object')
  }
  const blockText = flow.name
  return (
    <TaskShapeWrapper>
      <FlowBlockViewLink flowId={flow.id} links={links}>
        <GraphLabel>{blockText}</GraphLabel>
      </FlowBlockViewLink>
    </TaskShapeWrapper>
  )
}
