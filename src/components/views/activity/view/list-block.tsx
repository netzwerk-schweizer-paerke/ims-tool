import { GraphLabel } from '@/components/graph/graph-label'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { ListBlockViewLink } from '@/components/views/activity/view/list-block-view-link'
import { ViewLinks } from '@/components/views/view-links'
import { TaskList } from '@/payload-types'

type Props = {
  links: ViewLinks
  list: number | TaskList
}

export const ListBlock = ({ links, list }: Props) => {
  if (typeof list === 'number') {
    throw new TypeError('ListBlock flow prop should be a List object')
  }
  const blockText = list.name
  return (
    <TaskShapeWrapper>
      <ListBlockViewLink links={links} listId={list.id}>
        <GraphLabel>{blockText}</GraphLabel>
      </ListBlockViewLink>
    </TaskShapeWrapper>
  )
}
