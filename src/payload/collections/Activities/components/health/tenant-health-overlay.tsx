'use client'
import { Button, Drawer, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/health/tenant-health-button'
import { HealthReport } from '@/payload/components/health/health-report'
import { useHealthCheck } from '@/payload/components/health/use-health-check'

type Props = {
  organisationId: number
}

export const TenantHealthOverlay: React.FC<Props> = ({ organisationId }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { error, report, run, running } = useHealthCheck()

  return (
    // No `Header` prop: Payload renders its own header — title plus the close X in the
    // top right — but only when Header is `undefined`. Passing `Header={null}` suppresses
    // it, which is why a hand-rolled close button ends up floating in the content.
    <Drawer slug={drawerSlug} title={t('dataHealth:title' as never)}>
      <div className={'flex w-full max-w-4xl flex-col gap-6'}>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {report && <HealthReport report={report} showOrganisation />}

        <div className="flex gap-2">
          <Button
            buttonStyle="primary"
            className={`${baseClass}__run`}
            disabled={running}
            onClick={() => run({ organisationId })}>
            {running ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-elevation-0)] border-t-transparent" />
                {t('dataHealth:checking' as never)}
              </span>
            ) : (
              t('dataHealth:run' as never)
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
