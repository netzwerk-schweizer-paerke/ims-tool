'use client'
import { Button, CloseMenuIcon, Drawer, useLocale, useModal, useTranslation, useAuth } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { useState } from 'react'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/clone-activity-button'
import { Activity } from '@/payload-types'
import {
  CloneActivityResponse,
  CloneStatistics,
} from '@/payload/collections/Activities/types/clone-statistics'
import ky from 'ky'
import {
  CloneStatusSuccess,
  CloneStatusPartial,
  CloneStatusError,
  CloneConfigurationForm,
} from './clone-activities'
import { useOrganisationSwitch } from '@/hooks/useOrganisationSwitch'

type Props = {
  activities: Activity[]
  targetOrganisations: { label: string; value: number }[]
}

export const CloneActivitiesOverlay: React.FC<Props> = ({ activities, targetOrganisations }) => {
  const { closeModal } = useModal()
  const locale = useLocale()
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { user } = useAuth()
  const { switchOrganisation, isSwitching } = useOrganisationSwitch()
  const [cloning, setCloning] = useState(false)
  const [status, setStatus] = useState<'error' | 'success' | 'partial' | ''>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [targetOrgId, setTargetOrgId] = useState<number | null>(null)
  const [targetOrgName, setTargetOrgName] = useState<string>('')
  const [cloneResults, setCloneResults] = useState<{
    success: Array<{
      activityId: number
      activityName: string
      statistics: CloneStatistics
    }>
    failed: Array<{
      activityId: string
      activityName: string
      error: string
    }>
  }>({ success: [], failed: [] })

  const onFormSubmit = async (
    selectedActivities: string[],
    targetOrganisation: { label: string; value: number },
  ) => {
    setCloning(true)
    setStatus('') // Clear any previous status
    const successResults: typeof cloneResults.success = []
    const failedResults: typeof cloneResults.failed = []

    // Store target organization for potential switching later
    setTargetOrgId(targetOrganisation.value)
    setTargetOrgName(targetOrganisation.label)

    // Validate inputs
    if (!selectedActivities.length) {
      setErrorMessage('No activities selected for cloning')
      setStatus('error')
      setCloning(false)
      return
    }

    if (!targetOrganisation?.value) {
      setErrorMessage('No target organisation selected')
      setStatus('error')
      setCloning(false)
      return
    }

    // Get all activities to clone
    const activitiesToClone = selectedActivities.map((activityId) => {
      const activity = activities.find((a) => a.id.toString() === activityId)
      return { id: activityId, name: activity?.name || 'Unknown' }
    })

    // Process each activity sequentially to avoid overwhelming the server
    for (const { id: activityId, name: activityName } of activitiesToClone) {
      try {
        const cloneEndpoint = `/api/activities/${activityId}/organisation/${targetOrganisation.value}${
          locale?.code ? `?locale=${locale.code}` : ''
        }`

        const response = await ky
          .post(cloneEndpoint, {
            timeout: 120000,
            retry: {
              limit: 2,
              methods: ['post'],
              statusCodes: [408, 413, 429, 500, 502, 503, 504],
            },
          })
          .json<CloneActivityResponse>()

        // Validate response structure
        if (!response?.activityId || !response?.statistics) {
          console.error('Invalid response structure:', response)
          failedResults.push({
            activityId,
            activityName,
            error: 'Invalid response structure from clone endpoint',
          })
          continue
        }

        successResults.push({
          activityId: response.activityId,
          activityName,
          statistics: response.statistics,
        })
      } catch (error: any) {
        console.error(`Failed to clone activity ${activityId}:`, error)

        let errorMessage: string = 'Unknown error occurred'

        // Handle different error types
        if (error.name === 'HTTPError') {
          try {
            const errorResponse = await error.response?.json()
            errorMessage =
              errorResponse?.error ||
              errorResponse?.message ||
              `HTTP ${error.response?.status} error`

            // Check for specific access denied errors
            if (error.response?.status === 403) {
              // Access denied - provide clear user feedback
              if (errorMessage.includes('source organization')) {
                errorMessage =
                  '🚫 Access Denied: You do not have permission to read activities from this organization'
              } else if (errorMessage.includes('target organization')) {
                errorMessage =
                  '🚫 Access Denied: You need admin rights in the target organization to clone activities'
              } else {
                errorMessage = '🚫 ' + errorMessage
              }
            }
          } catch {
            if (error.response?.status === 403) {
              errorMessage =
                '🚫 Access Denied: You do not have the required permissions for this operation'
            } else {
              errorMessage = `HTTP ${error.response?.status || 'unknown'} error`
            }
          }
        } else if (error.name === 'TimeoutError') {
          errorMessage = '⏱️ Request timed out. The activity may be too large to clone.'
        } else if (error.message) {
          errorMessage = error.message
        }

        failedResults.push({
          activityId,
          activityName,
          error: errorMessage,
        })
      }
    }

    // Store results
    setCloneResults({ success: successResults, failed: failedResults })

    // Set status based on results
    if (failedResults.length === 0) {
      setStatus('success')
    } else if (successResults.length === 0) {
      setStatus('error')
    } else {
      setStatus('partial')
    }

    setCloning(false)
  }

  const onSwitchToTargetOrg = async () => {
    if (!user?.id || !targetOrgId) return
    
    try {
      // Find the target organization object
      const targetOrg = targetOrganisations.find(org => org.value === targetOrgId)
      
      // Use the hook to switch organization - this will reload the page
      await switchOrganisation(user.id, targetOrgId, targetOrg ? { 
        id: targetOrg.value, 
        name: targetOrg.label,
        organisationLanguage: locale?.code
      } as any : undefined)
    } catch (error) {
      console.error('Failed to switch organization:', error)
    }
  }

  const onCloseClick = () => {
    // Only reload if there were successful clones
    const shouldReload = cloneResults.success.length > 0

    // Reset state
    setCloning(false)
    setStatus('')
    setErrorMessage('')
    setTargetOrgId(null)
    setTargetOrgName('')
    setCloneResults({ success: [], failed: [] })
    closeModal(drawerSlug)

    // Reload page to show new activities if any were created
    if (shouldReload) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return (
    <Drawer slug={drawerSlug} Header={null}>
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
              {cloneResults.failed.length > 0 && (
                <CloneStatusError failedResults={cloneResults.failed} />
              )}
            </>
          )}
          {status === 'success' && <CloneStatusSuccess results={cloneResults.success} />}
          {status === 'partial' && (
            <CloneStatusPartial
              successResults={cloneResults.success}
              failedResults={cloneResults.failed}
            />
          )}
          {status === '' && (
            <CloneConfigurationForm
              activities={activities}
              targetOrganisations={targetOrganisations}
              onSubmit={onFormSubmit}
              isCloning={cloning}
              baseClass={baseClass}
              onCancel={onCloseClick}
            />
          )}
          {cloning && (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
              <p>{t('cloneActivity:processing' as any)}</p>
            </div>
          )}
          {(status === 'error' || status === 'success' || status === 'partial') && (
            <div className="flex gap-2">
              {/* Show switch org button only on success */}
              {(status === 'success' || status === 'partial') && targetOrgId && (
                <Button
                  buttonStyle="primary"
                  className={`${baseClass}__switch-org`}
                  onClick={onSwitchToTargetOrg}
                  disabled={isSwitching}>
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
                onClick={onCloseClick}>
                {t('general:close')}
              </Button>
            </div>
          )}
        </div>
        <div>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__cancel`}
            onClick={onCloseClick}>
            <CloseMenuIcon />
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
