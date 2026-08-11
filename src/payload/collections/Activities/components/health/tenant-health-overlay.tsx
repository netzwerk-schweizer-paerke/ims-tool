'use client'
import { Button, CloseMenuIcon, Drawer, useModal, useTranslation } from '@payloadcms/ui'
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
    <Drawer Header={null} slug={drawerSlug}>
      <div className={'mt-12 flex justify-between gap-4'}>
        <div className={'flex w-full max-w-4xl flex-col gap-6'}>
          <h1 className={'text-2xl font-bold'}>{t('dataHealth:title' as never)}</h1>

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
        <DrawerCloseButton />
      </div>
    </Drawer>
  )
}

const DrawerCloseButton: React.FC = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { closeModal } = useModal()

  return (
    <Button
      aria-label={t('general:close')}
      buttonStyle="icon-label"
      className={`${baseClass}__close shrink-0`}
      onClick={() => closeModal(drawerSlug)}>
      <CloseMenuIcon />
    </Button>
  )
}
