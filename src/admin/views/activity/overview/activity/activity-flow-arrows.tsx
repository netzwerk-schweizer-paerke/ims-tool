'use client';
import { debounce } from 'lodash-es';
import { Key, useCallback, useEffect, useRef, useState } from 'react';
import '@/admin/components/graph/fields/graph/lib/arrow-styles.css';
import { arrowStyle } from '@/admin/components/graph/fields/graph/lib/arrow-style';
import { Activity } from '@/types/payload-types';
import { assignActivityBlockArrows } from '@/admin/views/activity/overview/activity/lib/assign-activity-block-arrows';
import Xarrow, { useXarrow, xarrowPropsType } from '@/lib/xarrows/src';

type Props = {
  activity: Activity;
};

export const ActivityFlowArrows: React.FC<Props> = ({ activity }) => {
  const ref = useRef<HTMLDivElement>(null);
  const updateXarrow = useXarrow();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const reference = ref.current;
    if (!reference) return;

    const handleResize = debounce(() => {
      setIsLoaded(true);
      updateXarrow();
    }, 100);

    const resizeObserver = new ResizeObserver(handleResize);

    if (reference) {
      resizeObserver.observe(reference);
    }

    // Clean up function
    return () => {
      if (reference) {
        resizeObserver.unobserve(reference);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderArrows = useCallback(() => {
    const arrowSet = assignActivityBlockArrows(activity);

    return arrowSet.map(({ arrows, id }) => {
      return arrows.map((arrow: xarrowPropsType, index: Key | null | undefined) => {
        const props = {
          ...arrow,
          start: `${id}-${arrow.start}`,
          end: `${id}-${arrow.end}`,
          ...arrowStyle,
        };
        return <Xarrow key={index} {...props} />;
      });
    });
  }, [activity]);

  return (
    <div ref={ref} className={'x-arrows absolute inset-0'}>
      {isLoaded && renderArrows()}
    </div>
  );
};
