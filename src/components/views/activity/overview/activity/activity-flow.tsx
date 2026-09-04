'use client'
import { ActivityFlowArrows } from '@/components/views/activity/overview/activity/activity-flow-arrows'
import { ActivityUntranslated } from '@/components/views/activity/overview/activity/activity-untranslated'
import { ActivityBlock } from '@/components/views/activity/overview/activity/block'
import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'
import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'

type Props = {
  activity: Activity
  links: ViewLinks
  locale: string
}

export const ActivityFlow = ({ activity, links, locale }: Props) => {
  if (!activity.name) {
    return <ActivityUntranslated activityId={activity.id} links={links} locale={locale} />
  }

  if (!activity.blocks || activity.blocks.length === 0) {
    return (
      <div className={'text-center'}>
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
    <div className={'activity-flow z-10 flex grow flex-col items-center justify-stretch'}>
      <div className={'relative flex w-min grow flex-col'}>
        {blocksDisplay.input.length === 0 ? (
          <ActivityBlock activityId={activity.id} links={links} type={'empty'} />
        ) : (
          blocksDisplay.input.map((block) => (
            <ActivityBlock
              activityId={activity.id}
              block={block}
              key={block.id}
              links={links}
              type={'input'}
            />
          ))
        )}
        {blocksDisplay.tasks.map((block) => (
          <ActivityBlock
            activityId={activity.id}
            block={block}
            key={block.id}
            links={links}
            type={'task'}
          />
        ))}
        <div className={'relative grow'}>
          <div className={'absolute left-1/2 top-0 h-full -translate-x-[1px] border'}></div>
        </div>
        {blocksDisplay.output.length === 0 ? (
          <ActivityBlock activityId={activity.id} links={links} type={'empty'} />
        ) : (
          blocksDisplay.output.map((block) => (
            <ActivityBlock
              activityId={activity.id}
              block={block}
              key={block.id}
              links={links}
              type={'output'}
            />
          ))
        )}
        <ActivityFlowArrows activity={activity} />
      </div>
    </div>
  )
}
