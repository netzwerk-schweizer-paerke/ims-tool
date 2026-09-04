import { toShare } from '@/lib/admin-stats/format'

type Props = {
  /** The reader-facing value, used as the accessible name and the hover title. */
  label: string
  total: number
  value: number
}

/**
 * A magnitude bar on a track one step lighter of the same ramp.
 *
 * One hue, more is darker. The bar carries no text, so the row's own number stays the
 * label and the colour never has to be read on its own.
 */
export const MeterBar = ({ label, total, value }: Props) => {
  const share = toShare(value, total)

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(share * 100)}
      className={'h-2 w-full overflow-hidden rounded-sm [background-color:var(--theme-elevation-100)]'}
      role={'meter'}
      title={label}>
      <div
        className={'h-full rounded-r-sm [background-color:var(--theme-elevation-600)]'}
        style={{ width: `${(share * 100).toFixed(2)}%` }}
      />
    </div>
  )
}
