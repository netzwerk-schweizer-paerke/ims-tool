'use client'

import { Button, Drawer, toast, useModal, useTranslation } from '@payloadcms/ui'
import ky, { isHTTPError } from 'ky'
import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'

import type {
  FetchLegacyDocsResponse,
  LegacyDocsStatistics,
} from '@/payload/collections/Activities/endpoints/legacy-fetcher/types'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { DrawerHeader } from '@/payload/components/drawer-header'

import { drawerSlug } from './fetch-legacy-docs-button'

// The endpoint answers a failure with `createCloneError`, which carries `error`.
// `message` covers a Payload error shape that the endpoint does not produce itself.
type FetchLegacyDocsErrorBody = {
  error?: string
  message?: string
}

type ProcessResult = {
  activityId: string
  activityName: string
  error?: string
  statistics: LegacyDocsStatistics
  success: boolean
}

export const FetchLegacyDocsOverlay = () => {
  const router = useRouter()
  const { closeModal } = useModal()
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const [isProcessing, setIsProcessing] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [processResults, setProcessResults] = useState<ProcessResult[]>([])
  const [overallStatistics, setOverallStatistics] = useState<LegacyDocsStatistics | null>(null)
  const [error, setError] = useState<null | string>(null)
  const [currentActivity, setCurrentActivity] = useState<null | string>(null)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const handleFetchLegacyDocs = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    setProcessResults([])
    setOverallStatistics(null)

    try {
      // Process all activities in a single request
      setCurrentActivity(t('legacyFetcher:processingAll'))

      const result = await ky
        .post('/api/activities/fetch-legacy-docs', {
          json: {
            dryRun,
          },
          timeout: 600_000, // 10 minutes timeout for bulk processing
        })
        .json<FetchLegacyDocsResponse>()

      // Extract statistics and activity breakdown
      const stats = result.statistics
      setOverallStatistics(stats)

      // Convert activity breakdown to process results
      if (stats.activityBreakdown) {
        const results: ProcessResult[] = stats.activityBreakdown.map((activity) => ({
          activityId: activity.id,
          activityName: activity.name,
          statistics: {
            documentsCreated: activity.documentsCreated,
            endTime: stats.endTime,
            errors: [],
            failedConversions: activity.failedConversions,
            linksConverted: activity.linksConverted,
            processedFields: 0,
            skippedFields: 0,
            startTime: stats.startTime,
            totalLinksFound: activity.linksFound,
          },
          success: true,
        }))
        setProcessResults(results)
      }

      // Show summary toast
      if (stats.totalLinksFound === 0) {
        toast.info(t('legacyFetcher:toast:noLinks', { count: stats.activitiesProcessed }))
      } else if (dryRun) {
        toast.success(
          t('legacyFetcher:toast:foundLinks', {
            count: stats.activitiesProcessed,
            links: stats.totalLinksFound,
          }),
        )
      } else {
        toast.success(
          t('legacyFetcher:toast:migrated', {
            converted: stats.linksConverted,
            count: stats.activitiesProcessed,
            links: stats.totalLinksFound,
          }),
        )
        if (stats.linksConverted > 0) {
          router.refresh()
        }
      }
    } catch (error_: unknown) {
      let errorMessage = t('legacyFetcher:error:generic')

      if (isHTTPError(error_)) {
        try {
          const errorData = await error_.response.json<FetchLegacyDocsErrorBody>()
          errorMessage = errorData.error || errorData.message || error_.message
        } catch {
          errorMessage = error_.message || t('legacyFetcher:error:fetchFailed')
        }
      } else if (error_ instanceof Error) {
        errorMessage = error_.message
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCurrentActivity(null)
      setIsProcessing(false)
    }
  }, [dryRun, router, t])

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return t('legacyFetcher:inProgress')
    const duration = endTime - startTime
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  const handleClose = () => {
    setIsProcessing(false)
    setProcessResults([])
    setOverallStatistics(null)
    setError(null)
    setDryRun(true)
    closeModal(drawerSlug)

    // Reload page if changes were made
    if (overallStatistics && !dryRun && overallStatistics.linksConverted > 0) {
      router.refresh()
    }
  }

  const handleReset = () => {
    setProcessResults([])
    setOverallStatistics(null)
    setError(null)
    setDryRun(true)
  }

  const runButtonLabel = () => {
    if (isProcessing) return t('legacyFetcher:processing')
    if (dryRun) return t('legacyFetcher:scanAll')
    return t('legacyFetcher:migrateAll')
  }

  return (
    <Drawer
      Header={<DrawerHeader onClose={handleClose} title={t('legacyFetcher:title')} />}
      slug={drawerSlug}>
      <div className="flex flex-col gap-4">

        {/* Configuration */}
        {processResults.length === 0 && (
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-semibold">{t('legacyFetcher:configuration')}</h3>

            {/* Dry Run Option */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  checked={dryRun}
                  className="rounded"
                  disabled={isProcessing}
                  id="dryRun"
                  onChange={(e) => setDryRun(e.target.checked)}
                  type="checkbox"
                />
                <label className="" htmlFor="dryRun">
                  {t('legacyFetcher:dryRun')}
                </label>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium">{t('legacyFetcher:steps:title')}</p>
              <ul className="ml-5 mt-2 list-disc text-sm">
                <li>{t('legacyFetcher:steps:scanFields')}</li>
                {!dryRun && (
                  <>
                    <li>{t('legacyFetcher:steps:downloadDocuments')}</li>
                    <li>{t('legacyFetcher:steps:createRecords')}</li>
                    <li>{t('legacyFetcher:steps:convertLinks')}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && currentActivity && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="font-medium">
                {t('legacyFetcher:processingActivity', { activity: currentActivity })}
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {processResults.length > 0 && overallStatistics && (
          <>
            {/* Overall Statistics */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold">{t('legacyFetcher:overallResults')}</h3>

              <div className="grid grid-cols-2 gap-2">
                <div>{t('legacyFetcher:duration')}</div>
                <div className="font-mono">
                  {formatDuration(overallStatistics.startTime, overallStatistics.endTime)}
                </div>

                <div>{t('legacyFetcher:activitiesProcessed')}</div>
                <div className="font-mono">{overallStatistics.activitiesProcessed}</div>

                <div>{t('legacyFetcher:totalLinksFound')}</div>
                <div className="font-mono">{overallStatistics.totalLinksFound}</div>

                {!dryRun && (
                  <>
                    <div>{t('legacyFetcher:documentsCreated')}</div>
                    <div className="font-mono">{overallStatistics.documentsCreated}</div>

                    <div>{t('legacyFetcher:linksConverted')}</div>
                    <div className="font-mono">{overallStatistics.linksConverted}</div>

                    <div>{t('legacyFetcher:failedConversions')}</div>
                    <div className="font-mono text-red-600">
                      {overallStatistics.failedConversions}
                    </div>
                  </>
                )}

                <div>{t('legacyFetcher:fieldsProcessed')}</div>
                <div className="font-mono">{overallStatistics.processedFields}</div>
              </div>
            </div>

            {/* Individual Activity Results */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold">{t('legacyFetcher:activityDetails')}</h3>
              <div className="max-h-96 overflow-y-auto">
                {overallStatistics.activityBreakdown?.map((activity) => {
                  const isExpanded = expandedActivities.has(activity.id)
                  const hasLinks = activity.linksFound > 0

                  return (
                    <div className="mb-3 border-b last:border-b-0" key={activity.id}>
                      <div
                        className={`flex items-center justify-between py-2 ${hasLinks ? 'cursor-pointer hover:bg-gray-100/20' : ''}`}
                        onClick={() => {
                          if (!hasLinks) {
                          	return;
                          }

                          const newExpanded = new Set(expandedActivities)
                          if (isExpanded) {
                            newExpanded.delete(activity.id)
                          } else {
                            newExpanded.add(activity.id)
                          }
                          setExpandedActivities(newExpanded)
                        }}>
                        <div className="flex items-center gap-2">
                          {hasLinks && (
                            <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                          )}
                          <span className="font-medium">{activity.name}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>
                            {t('legacyFetcher:links')}{' '}
                            <span className="font-mono">{activity.linksFound}</span>
                          </span>
                          {!dryRun && (
                            <>
                              <span className="text-green-600">
                                {t('legacyFetcher:converted')}{' '}
                                <span className="font-mono">{activity.linksConverted}</span>
                              </span>
                              {activity.failedConversions > 0 && (
                                <span className="text-red-600">
                                  {t('legacyFetcher:failed')}{' '}
                                  <span className="font-mono">{activity.failedConversions}</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && activity.linkDetails && (
                        <div className="mb-3 ml-6 rounded bg-gray-100/20 p-3">
                          <table className="w-full">
                            <thead className="border-b text-left">
                              <tr>
                                <th className="max-w-fit pb-1">
                                  {t('legacyFetcher:table:location')}
                                </th>
                                <th className="w-auto pb-1">
                                  {t('legacyFetcher:table:originalUrl')}
                                </th>
                                {!dryRun && (
                                  <th className="w-1/4 pb-1 text-center">
                                    {t('legacyFetcher:table:status')}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {activity.linkDetails.map((link, index) => (
                                <tr className="border-b last:border-b-0" key={index}>
                                  <td className="py-1 pr-2">
                                    <div className="break-words font-medium">
                                      {link.locationPath}
                                    </div>
                                  </td>
                                  <td className="py-1 pr-2">
                                    <div className="break-all" title={link.url}>
                                      {link.url}
                                    </div>
                                  </td>
                                  {!dryRun && (
                                    <td className="py-1 text-center">
                                      {link.converted ? (
                                        <span className="text-green-600">✓</span>
                                      ) : link.error ? (
                                        <span className="text-red-600" title={link.error}>
                                          ✗
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Errors */}
            {overallStatistics.errors && overallStatistics.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-2 font-semibold text-red-800">{t('legacyFetcher:errors')}</h4>
                <div className="max-h-32 overflow-y-auto">
                  {overallStatistics.errors.map((error, index) => (
                    <div className="mb-1 text-red-600" key={index}>
                      {error.url}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          {processResults.length === 0 ? (
            <>
              <Button buttonStyle="secondary" disabled={isProcessing} onClick={handleClose}>
                {t('general:cancel')}
              </Button>
              <Button disabled={isProcessing} onClick={handleFetchLegacyDocs}>
                {runButtonLabel()}
              </Button>
            </>
          ) : (
            <>
              {dryRun && overallStatistics && overallStatistics.totalLinksFound > 0 && (
                <Button
                  buttonStyle="primary"
                  onClick={() => {
                    setDryRun(false)
                    setProcessResults([])
                    setOverallStatistics(null)
                  }}>
                  {t('legacyFetcher:proceedWithMigration')}
                </Button>
              )}
              <Button buttonStyle="secondary" onClick={handleReset}>
                {t('legacyFetcher:processMore')}
              </Button>
              <Button
                buttonStyle={
                  dryRun || (overallStatistics && overallStatistics.linksConverted === 0)
                    ? 'secondary'
                    : 'primary'
                }
                onClick={handleClose}>
                {t('general:close')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
