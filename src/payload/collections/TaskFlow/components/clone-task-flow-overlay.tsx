'use client'
import { Button, CloseMenuIcon, Drawer, useTranslation } from '@payloadcms/ui'
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types'
import { TaskFlow } from '@/payload-types'
import {
  CloneConfigurationForm,
  CloneStatusError,
  CloneStatusPartial,
  CloneStatusSuccess,
} from '@/payload/utilities/cloning/ui/modal/clone-activities'
import { type CloneConfig, useCloneOverlay } from '@/payload/utilities/cloning/ui/hooks'
import { CloneLoadingOverlay } from '@/payload/utilities/cloning/ui/components'

// Use the same baseClass and drawerSlug as Activities for consistency
export const baseClass = 'clone-task-flows'
export const drawerSlug = 'clone-task-flows'

type Props = {
  documents: TaskFlow[] // GenericCloneButton passes 'documents'
  targetOrganisations: { label: string; value: number }[]
}

const cloneConfig: CloneConfig = {
  endpoint: '/api/task-flows/clone',
  resourceName: 'task flows',
  timeoutMultiplier: 120000,
  retryConfig: {
    limit: 2,
    methods: ['post'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
}

export const CloneTaskFlowOverlay: React.FC<Props> = ({
  documents: taskFlows,
  targetOrganisations,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const {
    // State
    cloning,
    status,
    targetOrgId,
    targetOrgName,
    cloneResults,
    errorMessage,
    isSwitching,

    // Actions
    handleSubmit,
    handleClose,
    handleOrgSwitch,
  } = useCloneOverlay(drawerSlug, targetOrganisations)

  const onFormSubmit = async (
    selectedItems: string[],
    targetOrganisation: { label: string; value: number },
  ) => {
    await handleSubmit(cloneConfig, {
      selectedItems,
      targetOrganisation,
    })
  }

  return (
    <Drawer slug={drawerSlug} Header={null}>
      <div className={'mt-12 grid grid-cols-[auto_min-content]'}>
        <div className={'flex flex-col gap-8'}>
          <h1 className={'text-2xl font-bold'}>{t('cloneTaskFlow:title' as any)}</h1>
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
              activities={taskFlows as any}
              targetOrganisations={targetOrganisations}
              onSubmit={onFormSubmit}
              isCloning={cloning}
              baseClass={baseClass}
              onCancel={handleClose}
            />
          )}
          <CloneLoadingOverlay isVisible={cloning} />
          {(status === 'error' || status === 'success' || status === 'partial') && (
            <div className="flex gap-2">
              {/* Show switch org button only on success */}
              {(status === 'success' || status === 'partial') && targetOrgId && (
                <Button
                  buttonStyle="primary"
                  className={`${baseClass}__switch-org`}
                  onClick={handleOrgSwitch}
                  disabled={isSwitching}>
                  {isSwitching ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('general:switching' as any)}
                    </span>
                  ) : (
                    <span>{t('cloneActivity:switchToTarget' as any)}</span>
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
