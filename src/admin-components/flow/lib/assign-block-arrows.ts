import { ProcessTaskCompoundBlock } from '@/admin-components/flow/flow-block';
import { processIoConnections } from '@/admin-components/graph/fields/graph/flows/io/connection-definitions';
import { processTaskConnections } from '@/admin-components/graph/fields/graph/flows/task/connection-definitions';
import { processTestConnections } from '@/admin-components/graph/fields/graph/flows/test/connection-definitions';
import { connectionTypes } from '@/admin-components/graph/fields/graph/hooks/use-arrows';
import { processTaskParallelConnections } from '@/admin-components/graph/fields/graph/flows/parallel/connection-definitions';

type ArrowType = {
  start: string;
  end: string;
  originalArrow: {
    position: string;
    type: string;
  };
};

type AccumulatorItem = {
  id: string;
  arrows: ArrowType[];
  leftId: string;
  rightId: string;
  blockType: string;
};

type ReturnObject = {
  id: string;
  arrows: any[];
  connections: any[];
  leftId: string;
  rightId: string;
};

type ReturnTuple = [ReturnObject | undefined, ReturnObject];

const connectionTypesSet = new Set(connectionTypes);

export const assignBlockArrows = (block: ProcessTaskCompoundBlock) => {
  let blockLeft, blockRight;

  const leftId = `${block.id}-left`;
  const rightId = `${block.id}-right`;

  switch (block.blockType) {
    case 'proc-task-io':
      if (block.graph?.io?.enabled) {
        blockLeft = {
          id: leftId,
          arrows: block.graph?.io?.connections,
          connections: processIoConnections,
          leftId,
          rightId,
        };
      }
      blockRight = {
        id: rightId,
        arrows: block.graph?.task?.connections,
        connections: processTaskConnections,
        leftId,
        rightId,
      };
      break;
    case 'proc-test':
      if (block.graph?.output?.enabled) {
        blockLeft = {
          id: leftId,
          arrows: block.graph?.output?.connections,
          connections: processIoConnections,
          leftId,
          rightId,
        };
      }
      blockRight = {
        id: rightId,
        arrows: block.graph?.test?.connections,
        connections: processTestConnections,
        leftId,
        rightId,
      };
      break;
    case 'proc-task-p':
      blockLeft = {
        id: leftId,
        arrows: block.graph?.task?.connections,
        connections: processTaskParallelConnections,
        leftId,
        rightId,
      };
      blockRight = {
        id: rightId,
        arrows: block.graph?.task?.connections,
        connections: processTaskParallelConnections,
        leftId,
        rightId,
      };
      break;
    default:
      throw new Error(`Block type not supported: ${(block as any).blockType}`);
  }

  if (!blockRight) {
    throw new Error('Block right should not be undefined');
  }

  // @ts-ignore
  const result: ReturnTuple = [blockLeft, blockRight as ReturnObject];

  const blockType = block.blockType;

  return result.reduce<AccumulatorItem[]>((acc, block) => {
    // Skip iteration if the block is undefined
    if (!block) {
      return acc;
    }

    const { connections, arrows, id, leftId, rightId } = block;

    arrows?.forEach((arrow) => {
      const definition = connections.find((c) => c.position === arrow.position)?.definitions;
      if (!definition) {
        return;
      }
      const displayArrows = definition[arrow.type]?.flat().map((a: any) => {
        return {
          ...a,
          originalArrow: arrow,
        };
      });

      if (displayArrows && displayArrows.length > 0) {
        acc.push({ arrows: displayArrows, id, leftId, rightId, blockType });
      }
    });
    return acc;
  }, []);
};
