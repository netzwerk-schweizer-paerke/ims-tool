import { ItemActions } from '@/components/clipboard/item-actions'
import { FlowBlock } from '@/components/views/activity/view/flow-block'
import { ListBlock } from '@/components/views/activity/view/list-block'
import { ViewLinks } from '@/components/views/view-links'
import { TaskFlow, TaskList } from '@/payload-types'

type Props = {
  links: ViewLinks
  /** The content locale of the edit links. The public share page shows none. */
  locale?: string
  /** The Prozessgruppe that holds these tiles. A paste before or after a tile lands in it. */
  parent?: { activityId: number; blockId: string }
  tasks:
    | (
        | { relationTo: 'task-flows'; value: number | TaskFlow }
        | { relationTo: 'task-lists'; value: number | TaskList }
      )[]
    | null
    | undefined
}

/**
 * The menu of one Prozess or Liste tile: edit, copy, and a paste before or after the tile
 * (PIMS-83). It sits inside the tile, top right.
 */
const TaskActions = ({
  links,
  locale,
  parent,
  task,
}: {
  links: ViewLinks
  locale?: string
  parent?: { activityId: number; blockId: string }
  task: { id: number; kind: 'task-flows' | 'task-lists'; name?: null | string }
}) => {
  if (!links.canEdit) {
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
        siblingTarget={
          organisationId === null || !parent
            ? undefined
            : {
                activityId: parent.activityId,
                anchor: { collection: task.kind, id: task.id },
                blockId: parent.blockId,
                kind: 'activityBlock',
                organisationId,
              }
        }
      />
    </div>
  )
}

export const TasksGrid = ({ links, locale, parent, tasks }: Props) => {
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
              <div className={'relative'} data-paste-key={record ? `task-flows:${record.id}` : undefined} key={i}>
                <FlowBlock flow={task.value} links={links} />
                {record && (
                  <TaskActions
                    links={links}
                    locale={locale}
                    parent={parent}
                    task={{ id: record.id, kind: 'task-flows', name: record.name }}
                  />
                )}
              </div>
            )
          }
          case 'task-lists': {
            return (
              <div className={'relative'} data-paste-key={record ? `task-lists:${record.id}` : undefined} key={i}>
                <ListBlock links={links} list={task.value} />
                {record && (
                  <TaskActions
                    links={links}
                    locale={locale}
                    parent={parent}
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
