import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import { xarrowPropsType } from '@/lib/xarrows/src'

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
  Partial<xarrowPropsType>[]
> = {
  none: [],
  'in-top': [
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: RootTargetName,
    },
  ],
  'in-bottom': [
    {
      start: OuterTargetsEnum.BOTTOM_RIGHT,
      end: RootTargetName,
    },
  ],
  'in-pass-by': [
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      showHead: false,
      showTail: false,
    },
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: RootTargetName,
    },
  ],
  'out-top': [
    {
      start: RootTargetName,
      end: OuterTargetsEnum.TOP_RIGHT,
      showHead: false,
      showTail: false,
    },
  ],
  'out-bottom': [
    {
      start: RootTargetName,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      showHead: false,
      showTail: false,
    },
  ],
  'out-pass-by': [
    {
      start: RootTargetName,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      showHead: false,
      showTail: false,
    },
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      showHead: false,
      showTail: false,
    },
  ],
  'pass-by': [
    {
      start: OuterTargetsEnum.TOP_RIGHT,
      end: OuterTargetsEnum.BOTTOM_RIGHT,
      showHead: false,
      showTail: false,
    },
  ],
}

const taskArrowBottomOptions = ['none', 'out'] as const

const taskArrowBottomDef: Record<
  (typeof taskArrowBottomOptions)[number],
  Partial<xarrowPropsType>[]
> = {
  none: [],
  out: [
    {
      start: RootTargetName,
      end: OuterTargetsEnum.BOTTOM_CENTER,
      showHead: false,
      showTail: false,
    },
  ],
}

const taskArrowTopOptions = ['none', 'in'] as const

const taskArrowTopDef: Record<(typeof taskArrowTopOptions)[number], Partial<xarrowPropsType>[]> = {
  none: [],
  in: [
    {
      start: OuterTargetsEnum.TOP_CENTER,
      end: RootTargetName,
    },
  ],
}

export const activityIOFieldConnections = [
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
