import { xarrowPropsType } from 'react-xarrows-updated';
import { RootTargetName } from '@/admin-components/graph/fields/graph/lib/root-target';
import { OuterTargetsEnum } from '@/admin-components/graph/fields/graph/lib/outer-targets';

export const taskArrowRightOptions = ['out', 'in'] as const;

export const taskArrowRightDef: Record<(typeof taskArrowRightOptions)[number], xarrowPropsType[]> =
  {
    in: [
      {
        start: OuterTargetsEnum.CENTER_RIGHT,
        end: RootTargetName,
      },
    ],
    out: [
      {
        start: RootTargetName,
        end: OuterTargetsEnum.CENTER_RIGHT,
      },
    ],
  };

export const processIoConnections = [
  {
    position: 'right',
    options: taskArrowRightOptions,
    definitions: taskArrowRightDef,
  },
];
