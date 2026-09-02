'use client'
import { Button, Drawer, useTranslation } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { Activity } from '@/payload-types'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/clone/clone-activity-button'
import { DrawerHeader } from '@/payload/components/drawer-header'
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
    <Drawer
      Header={
        <DrawerHeader onClose={handleClose} title={t('cloneActivity:title')} />
      }
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
                      {t('general:switching')}
                    </span>
                  ) : (
                    <span>
                      {t('cloneActivity:switchToTarget') || `Switch to ${targetOrgName}`}
                    </span>
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
