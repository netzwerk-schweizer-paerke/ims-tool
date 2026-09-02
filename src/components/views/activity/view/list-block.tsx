import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { ListBlockViewLink } from '@/components/views/activity/view/list-block-view-link'
import { TaskList } from '@/payload-types'

type Props = {
  list: number | TaskList
}

export const ListBlock = ({ list }: Props) => {
  if (typeof list === 'number') {
    throw new TypeError('ListBlock flow prop should be a List object')
  }
  const blockText = list.name
  return (
    <TaskShapeWrapper>
      <ListBlockViewLink listId={list.id}>{blockText}</ListBlockViewLink>
    </TaskShapeWrapper>
  )
}
