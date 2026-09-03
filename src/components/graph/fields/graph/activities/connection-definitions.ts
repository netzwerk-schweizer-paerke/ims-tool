import {
  ArrowSpec,
  ConnectionDefinition,
} from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

const taskArrowRightOptions = [
  'in-top',
  'in-bottom',
  'in-pass-by',
  'out-top',
  'out-bottom',
  'out-pass-by',
  'pass-by',
  'none',
] as const

const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  ArrowSpec[]
> = {
  'in-bottom': [
    {
      end: RootTargetName,
      endAnchor: 'right',
      start: OuterTargetsEnum.BOTTOM_RIGHT,
      startAnchor: 'top',
    },
  ],
  'in-pass-by': [
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: OuterTargetsEnum.TOP_RIGHT,
      startAnchor: 'bottom',
    },
    {
      end: RootTargetName,
      endAnchor: 'right',
      start: OuterTargetsEnum.TOP_RIGHT,
      startAnchor: 'left',
    },
  ],
  'in-top': [
    {
      end: RootTargetName,
      endAnchor: 'right',
      start: OuterTargetsEnum.TOP_RIGHT,
      startAnchor: 'bottom',
    },
  ],
  none: [],
  'out-bottom': [
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'right',
    },
  ],
  'out-pass-by': [
    {
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      endAnchor: 'top',
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
      end: OuterTargetsEnum.TOP_RIGHT,
      endAnchor: 'bottom',
      showHead: false,
      showTail: false,
      start: RootTargetName,
      startAnchor: 'right',
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

// Shared by both activity blocks (io and task) — the two definition files were byte
// identical apart from the export name. Split them again if they ever need to diverge.
export const activityConnections = [
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
