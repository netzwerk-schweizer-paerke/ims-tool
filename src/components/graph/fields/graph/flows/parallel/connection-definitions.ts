import {
  ArrowSpec,
  ConnectionDefinition,
} from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  RootTargetLeftName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'

const taskArrowRightOptions = ['pass-by', 'none'] as const
const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  ArrowSpec[]
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
  ArrowSpec[]
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
const taskArrowTopDef: Record<(typeof taskArrowTopOptions)[number], ArrowSpec[]> = {
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
] satisfies ConnectionDefinition[]
