'use client'
import Link from 'next/link'

import { ActivityEditLink } from '@/components/views/activity/overview/activity/activity-edit-link'
import { ActivityFlowArrows } from '@/components/views/activity/overview/activity/activity-flow-arrows'
import { ActivityBlock } from '@/components/views/activity/overview/activity/block'
import { Translate } from '@/lib/translate'
import { Xwrapper } from '@/lib/xarrows/src'
import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'

type Props = {
  activity: Activity
  locale: string
}

export const ActivityStrategy: React.FC<Props> = ({ activity, locale }) => {
  if (!activity.name) {
    return (
      <div>
        <p>
          This activity is not available in the currently selected locale ({locale.toUpperCase()}).
          Translate it or switch to a different locale.
        </p>
        <Link
          className={'link-hover link'}
          href={`/admin/collections/activities/${activity.id}?locale=${locale}`}>
          View this activity in edit mode
        </Link>
      </div>
    )
  }

  if (!activity.blocks || activity.blocks.length === 0) {
    return (
      <div>
        <p>
          <Translate k={'activityLandscape:noBlocks'} />
        </p>
      </div>
    )
  }

  // Initialize the blocksDisplay object with empty arrays for input, output, and tasks
  const blocksDisplay: {
    input: ActivityIOBlock[]
    output: ActivityIOBlock[]
    tasks: ActivityTaskBlock[]
  } = {
    input: [],
    output: [],
    tasks: [],
  }

  // Transform the blocks array so that the first io block, if present, is followed by an array of task blocks,
  // which is followed by an io block if it is set, as last block.
  activity.blocks.reduce((acc, block, currentIndex) => {
    if (block.blockType === 'activity-io' && currentIndex === 0) {
      acc.input.push(block)
    }
    if (
      block.blockType === 'activity-io' &&
      activity.blocks?.length &&
      currentIndex === activity.blocks.length - 1
    ) {
      acc.output.push(block)
    }
    if (block.blockType === 'activity-task') {
      acc.tasks.push(block)
    }
    return acc
  }, blocksDisplay)

  return (
    <Xwrapper>
      <div className={'activity-strategy z-10 flex w-min flex-col'}>
        <div className={'text-center'}>
          <h2 className={'mx-auto max-w-52 hyphens-auto text-xl font-bold'}>{activity.name}</h2>
          <ActivityEditLink id={activity.id} locale={locale} />
        </div>
        <div className={'relative flex h-full grow flex-col justify-center'}>
          {blocksDisplay.input.length === 0 ? (
            <ActivityBlock activityId={activity.id} type={'empty'} />
          ) : (
            blocksDisplay.input.map((block) => (
              <ActivityBlock activityId={activity.id} block={block} key={block.id} type={'input'} />
            ))
          )}
          {blocksDisplay.tasks.map((block) => (
            <ActivityBlock activityId={activity.id} block={block} key={block.id} type={'task'} />
          ))}
          {blocksDisplay.output.length === 0 ? (
            <ActivityBlock activityId={activity.id} type={'empty'} />
          ) : (
            blocksDisplay.output.map((block) => (
              <ActivityBlock activityId={activity.id} block={block} key={block.id} type={'output'} />
            ))
          )}
          <ActivityFlowArrows activity={activity} />
        </div>
      </div>
    </Xwrapper>
  )
}
