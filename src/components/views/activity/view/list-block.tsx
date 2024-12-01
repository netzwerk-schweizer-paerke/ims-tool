import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { TaskList } from '@/payload-types'
import { ListBlockViewLink } from '@/components/views/activity/view/list-block-view-link'

type Props = {
  list: TaskList | number
}

export const ListBlock: React.FC<Props> = ({ list }) => {
  if (typeof list === 'number') {
    throw new Error('ListBlock flow prop should be a List object')
  }
  const blockText = list.name
  return (
    <TaskShapeWrapper>
      <ListBlockViewLink listId={list.id}>{blockText}</ListBlockViewLink>
    </TaskShapeWrapper>
  )
}
