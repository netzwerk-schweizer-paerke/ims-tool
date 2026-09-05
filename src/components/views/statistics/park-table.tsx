import Link from 'next/link'

import type { ParkStatsRow } from '@/lib/admin-stats/types'

import { MeterBar } from '@/components/views/statistics/meter-bar'
import { formatBytes, formatCount } from '@/lib/admin-stats/format'
import { Translate } from '@/lib/translate'

type Props = {
  /** The Payload admin language, which drives every number in this table. */
  locale: string
  rows: ParkStatsRow[]
}

const CELL = 'px-3 py-2 text-right tabular-nums [color:var(--theme-text)]'
const HEAD = 'px-3 py-2 text-right text-xs font-normal [color:var(--theme-elevation-500)]'

export const ParkTable = ({ locale, rows }: Props) => {
  if (rows.length === 0) {
    return (
      <p className={'m-0 text-sm [color:var(--theme-elevation-500)]'}>
        <Translate k={'statistics:parkTable:empty'} />
      </p>
    )
  }

  const largest = Math.max(...rows.map((row) => row.storageBytes), 0)

  return (
    <div className={'w-full overflow-x-auto'}>
      <table className={'w-full border-collapse text-sm'}>
        <thead>
          <tr className={'border-b [border-color:var(--theme-border-color)]'}>
            <th className={`${HEAD} text-left`} scope={'col'}>
              <Translate k={'statistics:parkTable:park'} />
            </th>
            <th className={`${HEAD} text-left`} scope={'col'}>
              <Translate k={'statistics:parkTable:language'} />
            </th>
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:users'} />
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
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:documents'} />
            </th>
            <th className={HEAD} scope={'col'}>
              <Translate k={'statistics:kpi:storage'} />
            </th>
            <th className={`${HEAD} w-32 text-left`} scope={'col'}>
              <Translate k={'statistics:parkTable:share'} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={'border-b [border-color:var(--theme-border-color)]'} key={row.id}>
              <th className={'px-3 py-2 text-left font-normal [color:var(--theme-text)]'} scope={'row'}>
                <Link
                  className={'underline underline-offset-4 opacity-80 hover:opacity-100'}
                  href={`/admin/collections/organisations/${row.id}`}>
                  {row.name}
                </Link>
              </th>
              <td className={'px-3 py-2 text-left uppercase [color:var(--theme-elevation-500)]'}>
                {row.language}
              </td>
              <td className={CELL}>{formatCount(row.users, locale)}</td>
              <td className={CELL}>{formatCount(row.activities, locale)}</td>
              <td className={CELL}>{formatCount(row.taskFlows, locale)}</td>
              <td className={CELL}>{formatCount(row.taskLists, locale)}</td>
              <td className={CELL}>{formatCount(row.documents, locale)}</td>
              <td className={CELL}>{formatBytes(row.storageBytes, locale)}</td>
              <td className={'px-3 py-2'}>
                <MeterBar
                  label={formatBytes(row.storageBytes, locale)}
                  total={largest}
                  value={row.storageBytes}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
