import type { ReactNode } from 'react'

type Props = {
  /** A short qualifier under the value, such as a unit or a share. */
  hint?: ReactNode
  label: ReactNode
  value: string
}

/**
 * One headline number. The value uses proportional figures, because a standalone number
 * at display size reads loose with `tabular-nums`.
 */
export const StatTile = ({ hint, label, value }: Props) => (
  <div
    className={
      'flex flex-col gap-1 rounded-md border p-4 [background-color:var(--theme-elevation-0)] [border-color:var(--theme-border-color)]'
    }>
    <span className={'text-xs [color:var(--theme-elevation-500)]'}>{label}</span>
    <span className={'text-2xl font-semibold [color:var(--theme-text)]'}>{value}</span>
    {hint ? <span className={'text-xs [color:var(--theme-elevation-500)]'}>{hint}</span> : null}
  </div>
)
