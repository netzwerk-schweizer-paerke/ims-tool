import { FlowBlock } from '@/components/views/activity/view/flow-block'
import { ListBlock } from '@/components/views/activity/view/list-block'
import { ViewLinks } from '@/components/views/view-links'
import { TaskFlow, TaskList } from '@/payload-types'

type Props = {
  links: ViewLinks
  tasks:
    | (
        | { relationTo: 'task-flows'; value: number | TaskFlow }
        | { relationTo: 'task-lists'; value: number | TaskList }
      )[]
    | null
    | undefined
}

export const TasksGrid = ({ links, tasks }: Props) => {
  if (!tasks) {
    return null
  }
  return (
    <>
      {tasks.map((task, i) => {
        switch (task.relationTo) {
          case 'task-flows': {
            return (
              <div key={i}>
                <FlowBlock flow={task.value} links={links} />
              </div>
            )
          }
          case 'task-lists': {
            return (
              <div key={i}>
                <ListBlock links={links} list={task.value} />
              </div>
            )
          }
        }
      })}
    </>
  )
}
