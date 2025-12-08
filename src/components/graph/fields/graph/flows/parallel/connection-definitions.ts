import { xarrowPropsType } from '@/lib/xarrows/src'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  RootTargetLeftName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'

const taskArrowRightOptions = ['pass-by', 'none'] as const
const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  Partial<xarrowPropsType>[]
> = {
  none: [],
  'pass-by': [
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      startAnchor: 'bottom',
      endAnchor: 'top',
      showHead: false,
      showTail: false,
    },
  ],
}

const taskArrowBottomOptions = ['out'] as const
const taskArrowBottomDef: Record<
  (typeof taskArrowBottomOptions)[number],
  Partial<xarrowPropsType>[]
> = {
  out: [
    {
      start: RootTargetLeftName,
      end: OuterTargetsEnum.BOTTOM_CENTER,
      startAnchor: 'bottom',
      endAnchor: 'top',
      showHead: false,
      showTail: false,
    },
    {
      start: RootTargetRightName,
      end: OuterTargetsEnum.BOTTOM_CENTER,
      startAnchor: 'bottom',
      endAnchor: 'top',
      showHead: false,
      showTail: false,
    },
  ],
}

const taskArrowTopOptions = ['in'] as const
const taskArrowTopDef: Record<(typeof taskArrowTopOptions)[number], Partial<xarrowPropsType>[]> = {
  in: [
    {
      start: OuterTargetsEnum.TOP_CENTER,
      end: RootTargetLeftName,
      startAnchor: 'bottom',
      endAnchor: 'top',
    },
    {
      start: OuterTargetsEnum.TOP_CENTER,
      end: RootTargetRightName,
      startAnchor: 'bottom',
      endAnchor: 'top',
    },
  ],
}

export const processTaskParallelConnections = [
  {
    position: 'top',
    options: taskArrowTopOptions,
    definitions: taskArrowTopDef,
  },
  {
    position: 'right',
    options: taskArrowRightOptions,
    definitions: taskArrowRightDef,
  },
  {
    position: 'bottom',
    options: taskArrowBottomOptions,
    definitions: taskArrowBottomDef,
  },
]
