import { ItemActions } from '@/components/clipboard/item-actions'
import { FlowBlock } from '@/components/views/activity/view/flow-block'
import { ListBlock } from '@/components/views/activity/view/list-block'
import { ViewLinks } from '@/components/views/view-links'
import { TaskFlow, TaskList } from '@/payload-types'

type Props = {
  links: ViewLinks
  /** The content locale of the edit links. The public share page shows none. */
  locale?: string
  tasks:
    | (
        | { relationTo: 'task-flows'; value: number | TaskFlow }
        | { relationTo: 'task-lists'; value: number | TaskList }
      )[]
    | null
    | undefined
}

/**
 * The menu of one Prozess or Liste tile: edit, and copy for a paste into another Prozessgruppe
 * (PIMS-83). It sits in the top right corner, outside the shape.
 */
const TaskActions = ({
  links,
  locale,
  task,
}: {
  links: ViewLinks
  locale?: string
  task: { id: number; kind: 'task-flows' | 'task-lists'; name?: null | string }
}) => {
  if (!links.showEdit) {
    return null
  }

  const organisationId = links.canCopy ? (links.organisationId ?? null) : null

  return (
    <div className={'absolute right-1 top-1 z-10'}>
      <ItemActions
        copyItem={
          organisationId === null
            ? undefined
            : { id: task.id, kind: task.kind, label: task.name ?? '', organisationId }
        }
        editHref={`/admin/collections/${task.kind}/${task.id}${locale ? `?locale=${locale}` : ''}`}
      />
    </div>
  )
}

export const TasksGrid = ({ links, locale, tasks }: Props) => {
  if (!tasks) {
    return null
  }
  return (
    <>
      {tasks.map((task, i) => {
        // A relation the read did not populate renders no menu, because it carries no name.
        const record = typeof task.value === 'number' ? null : task.value

        switch (task.relationTo) {
          case 'task-flows': {
            return (
              <div className={'relative'} key={i}>
                <FlowBlock flow={task.value} links={links} />
                {record && (
                  <TaskActions
                    links={links}
                    locale={locale}
                    task={{ id: record.id, kind: 'task-flows', name: record.name }}
                  />
                )}
              </div>
            )
          }
          case 'task-lists': {
            return (
              <div className={'relative'} key={i}>
                <ListBlock links={links} list={task.value} />
                {record && (
                  <TaskActions
                    links={links}
                    locale={locale}
                    task={{ id: record.id, kind: 'task-lists', name: record.name }}
                  />
                )}
              </div>
            )
          }
        }
      })}
    </>
  )
}
