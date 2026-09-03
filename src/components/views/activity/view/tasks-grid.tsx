import { FlowBlock } from '@/components/views/activity/view/flow-block'
import { ListBlock } from '@/components/views/activity/view/list-block'
import { TaskFlow, TaskList } from '@/payload-types'

type Props = {
  tasks:
    | (
        | { relationTo: 'task-flows'; value: number | TaskFlow }
        | { relationTo: 'task-lists'; value: number | TaskList }
      )[]
    | null
    | undefined
}

export const TasksGrid = ({ tasks }: Props) => {
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
                <FlowBlock flow={task.value} />
              </div>
            )
          }
          case 'task-lists': {
            return (
              <div key={i}>
                <ListBlock list={task.value} />
              </div>
            )
          }
        }
      })}
    </>
  )
}
