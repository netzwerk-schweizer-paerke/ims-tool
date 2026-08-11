'use client'
import { Button, CloseMenuIcon, Drawer, useTranslation } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { Activity } from '@/payload-types'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/clone/clone-activity-button'
import { CloneLoadingOverlay } from '@/payload/utilities/cloning/ui/components'
import { type CloneConfig, useCloneOverlay } from '@/payload/utilities/cloning/ui/hooks'
import {
  CloneConfigurationForm,
  CloneStatusError,
  CloneStatusPartial,
  CloneStatusSuccess,
} from '@/payload/utilities/cloning/ui/modal/clone-activities'

type Props = {
  documents: Activity[] // Changed from 'activities' to match GenericCloneButton interface
  targetOrganisations: { label: string; value: number }[]
}

const cloneConfig: CloneConfig = {
  endpoint: '/api/activities/clone',
  resourceName: 'activities',
  // Cloning is not idempotent — never retry a 5xx, the server may have committed
  // before failing to respond. See use-clone-api.ts.
  retryConfig: {
    limit: 2,
    methods: ['post'],
    statusCodes: [429],
  },
  timeoutMultiplier: 300_000,
}

export const CloneActivityOverlay: React.FC<Props> = ({ documents, targetOrganisations }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const {
    cloneResults,
    // State
    cloning,
    errorMessage,
    handleClose,
    handleOrgSwitch,
    // Actions
    handleSubmit,
    isSwitching,

    status,
    targetOrgId,
    targetOrgName,
  } = useCloneOverlay(drawerSlug, targetOrganisations)

  const onFormSubmit = async (
    selectedActivities: string[],
    targetOrganisation: { label: string; value: number },
  ) => {
    await handleSubmit(cloneConfig, {
      selectedItems: selectedActivities,
      targetOrganisation,
    })
  }

  return (
    <Drawer Header={null} slug={drawerSlug}>
      <div className={'mt-12 grid grid-cols-[auto_min-content]'}>
        <div className={'flex flex-col gap-8'}>
          <h1 className={'text-2xl font-bold'}>{t('cloneActivity:title' as any)}</h1>
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
              isCloning={cloning}
              onCancel={handleClose}
              onSubmit={onFormSubmit}
              targetOrganisations={targetOrganisations}
            />
          )}
          <CloneLoadingOverlay isVisible={cloning} />
          {['error', 'partial', 'success'].includes(status) && (
            <div className="flex gap-2">
              {/* Show switch org button only on success */}
              {(status === 'success' || status === 'partial') && targetOrgId && (
                <Button
                  buttonStyle="primary"
                  className={`${baseClass}__switch-org`}
                  disabled={isSwitching}
                  onClick={handleOrgSwitch}>
                  {isSwitching ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('general:switching' as any)}
                    </span>
                  ) : (
                    <span>
                      {t('cloneActivity:switchToTarget' as any) || `Switch to ${targetOrgName}`}
                    </span>
                  )}
                </Button>
              )}
              <Button
                buttonStyle="secondary"
                className={`${baseClass}__cancel`}
                onClick={handleClose}>
                {t('general:close')}
              </Button>
            </div>
          )}
        </div>
        <div>
          <Button buttonStyle="icon-label" className={`${baseClass}__cancel`} onClick={handleClose}>
            <CloseMenuIcon />
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
