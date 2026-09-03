import {
  ArrowSpec,
  ConnectionDefinition,
} from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

const taskArrowRightOptions = ['out-top', 'out-bottom', 'out-pass-by', 'pass-by', 'none'] as const

const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  ArrowSpec[]
> = {
  none: [],
  'out-bottom': [
    {
      end: OuterTargetsEnum.CENTER_RIGHT,
      endAnchor: 'left',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'right',
    },
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: OuterTargetsEnum.CENTER_RIGHT,
      startAnchor: 'bottom',
    },
  ],
  'out-pass-by': [
    {
      end: OuterTargetsEnum.CENTER_RIGHT,
      endAnchor: 'left',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'right',
    },
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: OuterTargetsEnum.TOP_RIGHT,
      startAnchor: 'bottom',
    },
  ],
  'out-top': [
    {
      end: OuterTargetsEnum.CENTER_RIGHT,
      endAnchor: 'left',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'right',
    },
    {
      end: OuterTargetsEnum.TOP_RIGHT,
      endAnchor: 'bottom',
      showHead: false,
      showTail: false,
      start: OuterTargetsEnum.CENTER_RIGHT,
      startAnchor: 'top',
    },
  ],
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

const taskArrowBottomOptions = ['none', 'out'] as const

const taskArrowBottomDef: Record<
  (typeof taskArrowBottomOptions)[number],
  ArrowSpec[]
> = {
  none: [],
  out: [
    {
      end: OuterTargetsEnum.BOTTOM_CENTER,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'bottom',
    },
  ],
}

const taskArrowTopOptions = ['none', 'in'] as const

const taskArrowTopDef: Record<(typeof taskArrowTopOptions)[number], ArrowSpec[]> = {
  in: [
    {
      end: RootTargetName,
      endAnchor: 'top',
      start: OuterTargetsEnum.TOP_CENTER,
      startAnchor: 'bottom',
    },
  ],
  none: [],
}

export const processTestConnections = [
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
