import type { ClonePairRow } from '@/lib/admin-stats/types'

import { formatCount } from '@/lib/admin-stats/format'
import { Translate } from '@/lib/translate'

type Props = {
  /** The Payload admin language, which drives every number in this table. */
  locale: string
  rows: ClonePairRow[]
}

const CELL = 'px-3 py-2 text-right tabular-nums [color:var(--theme-text)]'
const HEAD = 'px-3 py-2 text-right text-xs font-normal [color:var(--theme-elevation-500)]'
const TEXT = 'px-3 py-2 text-left font-normal [color:var(--theme-text)]'

/** The clones per source park and target park (PIMS-93). */
export const CloneTable = ({ locale, rows }: Props) => {
  if (rows.length === 0) {
    return (
      <p className={'m-0 text-sm [color:var(--theme-elevation-500)]'}>
        <Translate k={'statistics:clones:empty'} />
      </p>
    )
  }

  return (
    <div className={'w-full overflow-x-auto'}>
      <table className={'w-full border-collapse text-sm'}>
        <thead>
          <tr className={'border-b [border-color:var(--theme-border-color)]'}>
            <th className={`${HEAD} text-left`} scope={'col'}>
              <Translate k={'statistics:clones:source'} />
            </th>
            <th className={`${HEAD} text-left`} scope={'col'}>
              <Translate k={'statistics:clones:target'} />
            </th>
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:activities'} />
            </th>
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:taskFlows'} />
            </th>
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:taskLists'} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className={'border-b [border-color:var(--theme-border-color)]'}
              key={`${row.sourceName}:${row.targetName}`}>
              <td className={TEXT}>{row.sourceName}</td>
              <td className={TEXT}>{row.targetName}</td>
              <td className={CELL}>{formatCount(row.activities, locale)}</td>
              <td className={CELL}>{formatCount(row.taskFlows, locale)}</td>
              <td className={CELL}>{formatCount(row.taskLists, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
