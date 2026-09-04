'use client'
import { Button, Drawer, useTranslation } from '@payloadcms/ui'
import { type DataFromCollectionSlug } from 'payload'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { DrawerHeader } from '@/payload/components/drawer-header'
import { CloneLoadingOverlay } from '@/payload/utilities/cloning/ui/components'
import {
  type CloneableCollectionSlug,
  type CloneConfig,
  type TargetOrganisation,
} from '@/payload/utilities/cloning/ui/hooks/types'
import { useCloneOverlay } from '@/payload/utilities/cloning/ui/hooks/use-clone-overlay'
import { CloneConfigurationForm } from '@/payload/utilities/cloning/ui/modal/clone-activities/clone-configuration-form'
import { CloneStatusError } from '@/payload/utilities/cloning/ui/modal/clone-activities/clone-status-error'
import { CloneStatusPartial } from '@/payload/utilities/cloning/ui/modal/clone-activities/clone-status-partial'
import { CloneStatusSuccess } from '@/payload/utilities/cloning/ui/modal/clone-activities/clone-status-success'

import { type CloneI18nNamespace, type CloneOverlayConfig } from './clone-overlay-config'

/** The props that `GenericCloneButton` hands to its `OverlayComponent`. */
export interface CloneOverlayComponentProps<TSlug extends CloneableCollectionSlug> {
  documents: DataFromCollectionSlug<TSlug>[]
  targetOrganisations: TargetOrganisation[]
}

interface CloneOverlayProps<TSlug extends CloneableCollectionSlug>
  extends CloneOverlayComponentProps<TSlug> {
  config: CloneOverlayConfig<TSlug>
}

// Cloning is not idempotent, so a 5xx is never retried: the server may have committed before
// it failed to respond. A 429 is rejected before any work starts. See use-clone-api.ts.
const retryConfig: NonNullable<CloneConfig['retryConfig']> = {
  limit: 2,
  methods: ['post'],
  statusCodes: [429],
}

const titleKey = {
  cloneActivity: 'cloneActivity:title',
  cloneTaskFlow: 'cloneTaskFlow:title',
  cloneTaskList: 'cloneTaskList:title',
} as const satisfies Record<CloneI18nNamespace, I18nKeys>

const switchToTargetKey = {
  cloneActivity: 'cloneActivity:switchToTarget',
  cloneTaskFlow: 'cloneTaskFlow:switchToTarget',
  cloneTaskList: 'cloneTaskList:switchToTarget',
} as const satisfies Record<CloneI18nNamespace, I18nKeys>

export const CloneOverlay = <TSlug extends CloneableCollectionSlug>({
  config,
  documents,
  targetOrganisations,
}: CloneOverlayProps<TSlug>) => {
  const { baseClass, collectionSlug, drawerSlug, i18nNamespace } = config
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const {
    cloneResults,
    cloning,
    errorMessage,
    handleClose,
    handleOrgSwitch,
    handleSubmit,
    isSwitching,
    status,
    targetOrgId,
  } = useCloneOverlay(drawerSlug, targetOrganisations)

  const onFormSubmit = async (selectedItems: string[], targetOrganisation: TargetOrganisation) => {
    await handleSubmit(
      {
        endpoint: config.endpoint,
        resourceName: config.resourceName,
        retryConfig,
        timeoutMultiplier: config.timeoutMultiplier,
      },
      { selectedItems, targetOrganisation },
    )
  }

  return (
    <Drawer
      Header={<DrawerHeader onClose={handleClose} title={t(titleKey[i18nNamespace])} />}
      slug={drawerSlug}>
      <div className={'flex w-full flex-col gap-8'}>
        {status === 'error' && (
          <>
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-600">{errorMessage}</p>
              </div>
            )}
            {cloneResults && <CloneStatusError results={cloneResults} />}
          </>
        )}
        {status === 'success' && cloneResults && <CloneStatusSuccess results={cloneResults} />}
        {status === 'partial' && cloneResults && <CloneStatusPartial results={cloneResults} />}
        {status === '' && (
          <CloneConfigurationForm
            activities={documents}
            baseClass={baseClass}
            collectionSlug={collectionSlug}
            isCloning={cloning}
            onCancel={handleClose}
            onSubmit={onFormSubmit}
            targetOrganisations={targetOrganisations}
          />
        )}
        <CloneLoadingOverlay isVisible={cloning} />
        {['error', 'partial', 'success'].includes(status) && (
          <div className="flex gap-2">
            {(status === 'success' || status === 'partial') && targetOrgId && (
              <Button
                buttonStyle="primary"
                className={`${baseClass}__switch-org`}
                disabled={isSwitching}
                onClick={handleOrgSwitch}>
                {isSwitching ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('general:switching')}
                  </span>
                ) : (
                  <span>{t(switchToTargetKey[i18nNamespace])}</span>
                )}
              </Button>
            )}
            {/* Close schedules a reload of this page. A reload after the switch lands on a
                document of the previous organisation, so block it while the switch runs. */}
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__cancel`}
              disabled={isSwitching}
              onClick={handleClose}>
              {t('general:close')}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
