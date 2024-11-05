import { ActivityBlock } from '@/admin/views/activity/overview/activity/block';
import { ActivityFlowArrows } from '@/admin/views/activity/overview/activity/activity-flow-arrows';
import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/types/payload-types';
import Link from 'next/link';
import { Translate } from '@/lib/translate';

type Props = {
  locale: string;
  activity: Activity;
};

export const ActivityFlow: React.FC<Props> = ({ activity, locale }) => {
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
    );
  }

  if (!activity.blocks || activity.blocks.length === 0) {
    return (
      <div className={'text-center'}>
        <p>
          <Translate k={'activityLandscape:noBlocks'} />
        </p>
      </div>
    );
  }

  // Initialize the blocksDisplay object with empty arrays for input, output, and tasks
  const blocksDisplay: {
    input: ActivityIOBlock[];
    output: ActivityIOBlock[];
    tasks: ActivityTaskBlock[];
  } = {
    input: [],
    output: [],
    tasks: [],
  };

  // Transform the blocks array so that the first io block, if present, is followed by an array of task blocks,
  // which is followed by an io block if it is set, as last block.
  activity.blocks.reduce((acc, block, currentIndex) => {
    if (block.blockType === 'activity-io' && currentIndex === 0) {
      acc.input.push(block);
    }
    if (
      block.blockType === 'activity-io' &&
      activity.blocks?.length &&
      currentIndex === activity.blocks.length - 1
    ) {
      acc.output.push(block);
    }
    if (block.blockType === 'activity-task') {
      acc.tasks.push(block);
    }
    return acc;
  }, blocksDisplay);

  return (
    <div className={'activity-flow z-10 flex grow flex-col items-center justify-stretch'}>
      <div className={'relative flex w-min grow flex-col'}>
        {blocksDisplay.input.length === 0 ? (
          <ActivityBlock type={'empty'} activityId={activity.id} />
        ) : (
          blocksDisplay.input.map((block) => (
            <ActivityBlock block={block} activityId={activity.id} type={'input'} key={block.id} />
          ))
        )}
        {blocksDisplay.tasks.map((block) => (
          <ActivityBlock block={block} activityId={activity.id} type={'task'} key={block.id} />
        ))}
        <div className={'relative grow'}>
          <div className={'absolute left-1/2 top-0 h-full -translate-x-[1px] border'}></div>
        </div>
        {blocksDisplay.output.length === 0 ? (
          <ActivityBlock activityId={activity.id} type={'empty'} />
        ) : (
          blocksDisplay.output.map((block) => (
            <ActivityBlock activityId={activity.id} block={block} type={'output'} key={block.id} />
          ))
        )}
        <ActivityFlowArrows activity={activity} />
      </div>
    </div>
  );
};
