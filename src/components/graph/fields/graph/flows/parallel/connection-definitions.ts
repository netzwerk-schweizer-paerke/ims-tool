import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  RootTargetLeftName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'
import { xarrowPropsType } from '@/lib/xarrows/src'

const taskArrowRightOptions = ['pass-by', 'none'] as const
const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  Partial<xarrowPropsType>[]
> = {
  none: [],
  'pass-by': [
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: OuterTargetsEnum.TOP_RIGHT,
      startAnchor: 'bottom',
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
      end: OuterTargetsEnum.BOTTOM_CENTER,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: RootTargetLeftName,
      startAnchor: 'bottom',
    },
    {
      end: OuterTargetsEnum.BOTTOM_CENTER,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: RootTargetRightName,
      startAnchor: 'bottom',
    },
  ],
}

const taskArrowTopOptions = ['in'] as const
const taskArrowTopDef: Record<(typeof taskArrowTopOptions)[number], Partial<xarrowPropsType>[]> = {
  in: [
    {
      end: RootTargetLeftName,
      endAnchor: 'top',
      start: OuterTargetsEnum.TOP_CENTER,
      startAnchor: 'bottom',
    },
    {
      end: RootTargetRightName,
      endAnchor: 'top',
      start: OuterTargetsEnum.TOP_CENTER,
      startAnchor: 'bottom',
    },
  ],
}

export const processTaskParallelConnections = [
  {
    definitions: taskArrowTopDef,
    options: taskArrowTopOptions,
    position: 'top',
  },
  {
    definitions: taskArrowRightDef,
    options: taskArrowRightOptions,
    position: 'right',
  },
  {
    definitions: taskArrowBottomDef,
    options: taskArrowBottomOptions,
    position: 'bottom',
  },
]
