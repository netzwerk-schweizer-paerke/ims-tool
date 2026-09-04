'use client'
import { Button, Drawer, useTranslation } from '@payloadcms/ui'
import { useState } from 'react'

import type { ParkStatsRow } from '@/lib/admin-stats/types'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { HealthReport } from '@/payload/components/health/health-report'
import { useHealthCheck } from '@/payload/components/health/use-health-check'

export const PARK_HEALTH_DRAWER = 'statistics-park-health'

type Props = {
  parks: ParkStatsRow[]
}

export const ParkHealthDrawer = ({ parks }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { error, report, run, running } = useHealthCheck()
  const [organisationId, setOrganisationId] = useState(parks[0]?.id ?? 0)
  const [checkExternalUrls, setCheckExternalUrls] = useState(false)

  const runLabel = t('dataHealth:run')
  const runningLabel = t('dataHealth:checking')

  return (
    <Drawer slug={PARK_HEALTH_DRAWER} title={t('statistics:maintenance:health')}>
      <div className={'flex w-full max-w-4xl flex-col gap-6'}>
        {error ? (
          <p className={'m-0 rounded-md border p-3 [border-color:var(--theme-error-250)] [color:var(--theme-error-600)]'}>
            {error}
          </p>
        ) : null}

        {report ? <HealthReport report={report} showOrganisation /> : null}

        <label className={'flex flex-col gap-1 text-sm'}>
          <span className={'[color:var(--theme-elevation-500)]'}>
            {t('statistics:parkTable:park')}
          </span>
          <select
            className={'rounded border p-2 [background-color:var(--theme-input-bg)] [border-color:var(--theme-border-color)] [color:var(--theme-text)]'}
            disabled={running || parks.length === 0}
            onChange={(event) => setOrganisationId(Number(event.target.value))}
            value={organisationId}>
            {parks.map((park) => (
              <option key={park.id} value={park.id}>
                {park.name}
              </option>
            ))}
          </select>
        </label>

        <label className={'flex items-start gap-2 text-sm'}>
          <input
            checked={checkExternalUrls}
            className={'mt-1'}
            disabled={running}
            onChange={(event) => setCheckExternalUrls(event.target.checked)}
            type={'checkbox'}
          />
          <span>
            {t('dataHealth:checkExternalUrls')}
            <span className={'block [color:var(--theme-elevation-500)]'}>
              {t('dataHealth:checkExternalUrlsHint')}
            </span>
          </span>
        </label>

        <div>
          <Button
            buttonStyle={'primary'}
            disabled={running || organisationId === 0}
            onClick={() => run({ checkExternalUrls, organisationId })}>
            {running ? runningLabel : runLabel}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
