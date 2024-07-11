'use client';
import Xarrow, { useXarrow } from 'react-xarrows-updated';
import { debounce } from 'lodash-es';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import '../graph/fields/graph/lib/arrow-styles.css';
import { arrowStyle } from '@/admin-components/graph/fields/graph/lib/arrow-style';
import { ProcessTaskCompoundBlock } from '@/admin-components/flow/flow-block';
import { assignBlockArrows } from '@/admin-components/flow/lib/assign-block-arrows';
import { RootTargetName } from '@/admin-components/graph/fields/graph/lib/root-target';

type Props = {
  taskFlowBlock: ProcessTaskCompoundBlock;
};

const getTestBlockLabel = (
  block: ProcessTaskCompoundBlock,
  position: 'right' | 'left' | 'bottom',
) => {
  if (block.blockType !== 'proc-test' || !block.graph?.test) {
    return undefined;
  }
  const label = block.graph.test[`${position}Boolean`];
  return label !== 'none' ? label : undefined;
};

export const TaskFlowArrows: React.FC<Props> = ({ taskFlowBlock }) => {
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
  }, []);

  const renderArrows = useCallback(() => {
    const arrowSet = assignBlockArrows(taskFlowBlock);

    return arrowSet.map(({ arrows, id, leftId, rightId }, index) => (
      <Fragment key={id + index}>
        {arrows.map((arrow, index) => {
          const startPrefix =
            id === leftId &&
            arrow.originalArrow.position === 'right' &&
            arrow.originalArrow.type === 'in'
              ? `${rightId}-${RootTargetName}`
              : `${id}-${arrow.start}`;
          const endPrefix =
            id === leftId &&
            arrow.originalArrow.position === 'right' &&
            arrow.originalArrow.type === 'out'
              ? `${rightId}-${RootTargetName}`
              : `${id}-${arrow.end}`;
          const props = {
            ...arrow,
            start: startPrefix,
            end: endPrefix,
            ...arrowStyle,
          };
          return <Xarrow key={startPrefix + endPrefix} {...props} />;
        })}
      </Fragment>
    ));
  }, [taskFlowBlock]);

  return (
    <div ref={ref} className={'x-arrows absolute inset-0'}>
      {isLoaded && renderArrows()}
    </div>
  );
};
