import { ArrowSpec } from '@/components/graph/fields/graph/lib/arrow-geometry'

// Re-exported so a `connection-definitions.ts` needs one type import, not two.
export type { ArrowSpec } from '@/components/graph/fields/graph/lib/arrow-geometry'

export const connectionPositions = ['bottom', 'left', 'right', 'top'] as const

export type ConnectionPosition = (typeof connectionPositions)[number]

/**
 * Every connection type any block can store. Each `connection-definitions.ts`
 * declares `satisfies ConnectionDefinition[]`, so adding an option that is not
 * listed here is a compile error — this union cannot silently drift from the
 * definitions again.
 */
export const connectionTypes = [
  'in',
  'in-bottom',
  'in-pass-by',
  'in-top',
  'none',
  'out',
  'out-bottom',
  'out-pass-by',
  'out-top',
  'pass-by',
] as const

/** The arrows to draw for one anchor position, keyed by the stored connection type. */
export type ArrowDefinitions = Partial<Record<ConnectionType, ArrowSpec[]>>

/** What one anchor position of a block supports: its arrows and the cycle order of its button. */
export type ConnectionDefinition = {
  definitions: ArrowDefinitions
  options: readonly ConnectionType[]
  position: ConnectionPosition
}

export type ConnectionStateType = {
  connections: ConnectionsType
  text?: string
  textBottom?: string
  textLeft?: string
  textRight?: string
  textTop?: string
}

export type ConnectionsType = {
  position: ConnectionPosition
  type: ConnectionType
}[]

export type ConnectionType = (typeof connectionTypes)[number]
