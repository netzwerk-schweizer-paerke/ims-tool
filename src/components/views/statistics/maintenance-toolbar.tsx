'use client'
import { DrawerToggler, useTranslation } from '@payloadcms/ui'

import type { ParkStatsRow } from '@/lib/admin-stats/types'

import { ORPHAN_DRAWER, OrphanDrawer } from '@/components/views/statistics/orphan-drawer'
import {
  PARK_HEALTH_DRAWER,
  ParkHealthDrawer,
} from '@/components/views/statistics/park-health-drawer'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Props = {
  locale: string
  parks: ParkStatsRow[]
}

const TOGGLE = 'btn btn--size-medium btn--style-secondary'

/**
 * Both sweeps read the whole installation, so neither runs on page load. The drawer runs it
 * on a click, and the page's own numbers stay cheap.
 */
export const MaintenanceToolbar = ({ locale, parks }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div className={'flex flex-wrap items-center gap-2'}>
      <DrawerToggler
        className={TOGGLE}
        disabled={parks.length === 0}
        slug={PARK_HEALTH_DRAWER}
        title={t('statistics:maintenance:healthHint')}>
        {t('statistics:maintenance:health')}
      </DrawerToggler>
      <DrawerToggler
        className={TOGGLE}
        slug={ORPHAN_DRAWER}
        title={t('statistics:maintenance:orphanReportHint')}>
        {t('statistics:maintenance:orphanReport')}
      </DrawerToggler>
      <ParkHealthDrawer parks={parks} />
      <OrphanDrawer locale={locale} />
    </div>
  )
}
