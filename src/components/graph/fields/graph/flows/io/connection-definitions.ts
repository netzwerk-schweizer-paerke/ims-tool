import {
  ArrowSpec,
  ConnectionDefinition,
} from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

export const taskArrowRightOptions = ['out', 'in'] as const

export const taskArrowRightDef: Record<
  (typeof taskArrowRightOptions)[number],
  ArrowSpec[]
> = {
  in: [
    {
      end: RootTargetName,
      endAnchor: 'right',
      start: OuterTargetsEnum.CENTER_RIGHT,
      startAnchor: 'left',
    },
  ],
  out: [
    {
      end: OuterTargetsEnum.CENTER_RIGHT,
      endAnchor: 'left',
      start: RootTargetName,
      startAnchor: 'right',
    },
  ],
}

export const processIoConnections = [
  {
    definitions: taskArrowRightDef,
    options: taskArrowRightOptions,
    position: 'right',
  },
] satisfies ConnectionDefinition[]
