import { ItemActions } from '@/components/clipboard/item-actions'
import { ConnectionStateType } from '@/components/graph/fields/graph/lib/connection-types'
import { GraphLabel } from '@/components/graph/graph-label'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { ActivityBlockViewLink } from '@/components/views/activity/overview/activity/activity-block-view-link'
import { BlockWrapper } from '@/components/views/activity/overview/activity/block-wrapper'
import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'
import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'

export type ActivityTaskCompoundBlock = (ActivityIOBlock | ActivityTaskBlock) & {
  graph?: { task?: ConnectionStateType }
  id: string
}

type Props = {
  activity: Activity
  block?: ActivityIOBlock | ActivityTaskBlock
  links: ViewLinks
  /** The content locale. The edit link opens the Thema form in it. */
  locale: string
  type: 'empty' | 'input' | 'output' | 'task'
}

/**
 * The menu inside one node (PIMS-83). Every node offers edit. A Prozessgruppe also offers copy,
 * and a paste before or after it. An input or output node frames its Thema and never moves.
 */
const BlockActions = ({
  activity,
  block,
  links,
  locale,
}: {
  activity: Activity
  block: ActivityIOBlock | ActivityTaskBlock
  links: ViewLinks
  locale: string
}) => {
  if (!links.showEdit || !block.id) {
    return null
  }

  // The edit form names each block row by its index in this locale.
  const index = activity.blocks?.findIndex((entry) => entry.id === block.id) ?? -1
  const editHref = `/admin/collections/activities/${activity.id}?locale=${locale}${index === -1 ? '' : `#blocks-row-${index}`}`
  const organisationId = links.canCopy ? (links.organisationId ?? null) : null
  const isTask = block.blockType === 'activity-task'

  return (
    <ItemActions
      copyItem={
        isTask && organisationId !== null
          ? {
              activityId: activity.id,
              blockId: block.id,
              kind: 'activityBlock',
              label: (block as ActivityTaskCompoundBlock).graph?.task?.text ?? '',
              organisationId,
            }
          : undefined
      }
      editHref={editHref}
      pasteTarget={
        isTask && organisationId !== null
          ? { activityId: activity.id, blockId: block.id, kind: 'activityBlock', organisationId }
          : undefined
      }
      siblingTarget={
        isTask && organisationId !== null
          ? {
              activityId: activity.id,
              anchor: { blockId: block.id },
              kind: 'activity',
              organisationId,
            }
          : undefined
      }
    />
  )
}

export const ActivityBlock = ({ activity, block, links, locale, type }: Props) => {
  if (!block || type === 'empty') {
    return <div className="activity-block"></div>
  }

  const blockText = (block as ActivityTaskCompoundBlock).graph?.task?.text || (
    <Translate k={'activityLandscape:blockHasNoName'} />
  )
  const actions = <BlockActions activity={activity} block={block} links={links} locale={locale} />
  const label = (
    <ActivityBlockViewLink activityId={activity.id} blockId={block.id} links={links}>
      <GraphLabel>{blockText}</GraphLabel>
    </ActivityBlockViewLink>
  )

  return (
    <BlockWrapper actions={actions} id={block.id} pasteKey={`block:${block.id}`}>
      {type === 'task' ? (
        <TaskShapeWrapper>{label}</TaskShapeWrapper>
      ) : (
        <IOShapeWrapper>{label}</IOShapeWrapper>
      )}
    </BlockWrapper>
  )
}
