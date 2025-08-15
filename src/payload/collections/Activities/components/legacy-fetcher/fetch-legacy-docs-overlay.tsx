'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Drawer, toast, useModal } from '@payloadcms/ui'
import ky from 'ky'
import { drawerSlug } from './fetch-legacy-docs-button'
import { Activity } from '@/payload-types'

type LegacyDocsStatistics = {
  startTime: number
  endTime?: number
  totalLinksFound: number
  documentsCreated: number
  linksConverted: number
  failedConversions: number
  processedFields: number
  skippedFields: number
  errors: Array<{
    url: string
    error: string
    timestamp: number
  }>
  activitiesProcessed?: number
  activityBreakdown?: Array<{
    id: string
    name: string
    linksFound: number
    linksConverted: number
    documentsCreated: number
    failedConversions: number
    linkDetails?: Array<{
      url: string
      parentEntity: string
      fieldLabel: string
      locationPath: string
      converted?: boolean
      error?: string
    }>
  }>
}

type ProcessResult = {
  activityId: string
  activityName: string
  statistics: LegacyDocsStatistics
  success: boolean
  error?: string
}

type Props = {
  activities: Activity[]
}

export const FetchLegacyDocsOverlay: React.FC<Props> = ({ activities }) => {
  const router = useRouter()
  const { closeModal } = useModal()

  const [isProcessing, setIsProcessing] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [processResults, setProcessResults] = useState<ProcessResult[]>([])
  const [overallStatistics, setOverallStatistics] = useState<LegacyDocsStatistics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentActivity, setCurrentActivity] = useState<string | null>(null)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  // Prepare activity options for the Select component
  const activityOptions = useMemo(() => {
    return activities.map((activity) => ({
      label: activity.name,
      value: activity.id.toString(),
    }))
  }, [activities])

  const handleFetchLegacyDocs = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    setProcessResults([])
    setOverallStatistics(null)

    try {
      // Process all activities in a single request
      setCurrentActivity('Processing all activities...')

      const result = await ky
        .post('/api/activities/fetch-legacy-docs', {
          json: {
            dryRun,
          },
          timeout: 600000, // 10 minutes timeout for bulk processing
        })
        .json<any>()

      // Extract statistics and activity breakdown
      const stats = result.statistics
      setOverallStatistics(stats)

      // Convert activity breakdown to process results
      if (stats.activityBreakdown) {
        const results: ProcessResult[] = stats.activityBreakdown.map((activity: any) => ({
          activityId: activity.id,
          activityName: activity.name,
          statistics: {
            startTime: stats.startTime,
            endTime: stats.endTime,
            totalLinksFound: activity.linksFound,
            documentsCreated: activity.documentsCreated,
            linksConverted: activity.linksConverted,
            failedConversions: activity.failedConversions,
            processedFields: 0,
            skippedFields: 0,
            errors: [],
          },
          success: true,
        }))
        setProcessResults(results)
      }

      // Show summary toast
      if (stats.totalLinksFound === 0) {
        toast.info(
          `No legacy links found in ${stats.activitiesProcessed} ${stats.activitiesProcessed === 1 ? 'activity' : 'activities'}`,
        )
      } else if (dryRun) {
        toast.success(
          `Found ${stats.totalLinksFound} legacy links across ${stats.activitiesProcessed} ${stats.activitiesProcessed === 1 ? 'activity' : 'activities'} (dry run)`,
        )
      } else {
        toast.success(
          `Successfully migrated ${stats.linksConverted} of ${stats.totalLinksFound} links across ${stats.activitiesProcessed} ${stats.activitiesProcessed === 1 ? 'activity' : 'activities'}`,
        )
        if (stats.linksConverted > 0) {
          router.refresh()
        }
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred'

      if (err?.name === 'HTTPError' && err?.response) {
        try {
          const errorData = await err.response.json()
          errorMessage = errorData.error || errorData.message || err.message
        } catch {
          errorMessage = err.message || 'Failed to fetch legacy documents'
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCurrentActivity(null)
      setIsProcessing(false)
    }
  }, [dryRun, router])

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return 'In progress...'
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

  return (
    <Drawer slug={drawerSlug} Header={null}>
      <div className="mt-12 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Fetch Legacy Documents</h2>

        {/* Configuration */}
        {processResults.length === 0 && (
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-semibold">Configuration</h3>

            {/* Dry Run Option */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded"
                  disabled={isProcessing}
                />
                <label htmlFor="dryRun" className="">
                  Dry run (scan only, don&#39;t make changes)
                </label>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium">This will:</p>
              <ul className="ml-5 mt-2 list-disc text-sm">
                <li>Scan all rich text fields for links to parcs-ims.ch</li>
                {!dryRun && (
                  <>
                    <li>Download documents from external URLs</li>
                    <li>Create new document records in the system</li>
                    <li>Convert external links to internal references</li>
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
              <span className="font-medium">Processing: {currentActivity}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {processResults.length > 0 && overallStatistics && (
          <>
            {/* Overall Statistics */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold">Overall Results</h3>

              <div className="grid grid-cols-2 gap-2">
                <div>Duration:</div>
                <div className="font-mono">
                  {formatDuration(overallStatistics.startTime, overallStatistics.endTime)}
                </div>

                <div>Activities Processed:</div>
                <div className="font-mono">{overallStatistics.activitiesProcessed}</div>

                <div>Total Links Found:</div>
                <div className="font-mono">{overallStatistics.totalLinksFound}</div>

                {!dryRun && (
                  <>
                    <div>Documents Created:</div>
                    <div className="font-mono">{overallStatistics.documentsCreated}</div>

                    <div>Links Converted:</div>
                    <div className="font-mono">{overallStatistics.linksConverted}</div>

                    <div>Failed Conversions:</div>
                    <div className="font-mono text-red-600">
                      {overallStatistics.failedConversions}
                    </div>
                  </>
                )}

                <div>Fields Processed:</div>
                <div className="font-mono">{overallStatistics.processedFields}</div>
              </div>
            </div>

            {/* Individual Activity Results */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold">Activity Details</h3>
              <div className="max-h-96 overflow-y-auto">
                {overallStatistics.activityBreakdown?.map((activity) => {
                  const isExpanded = expandedActivities.has(activity.id)
                  const hasLinks = activity.linksFound > 0

                  return (
                    <div key={activity.id} className="mb-3 border-b last:border-b-0">
                      <div
                        className={`flex items-center justify-between py-2 ${hasLinks ? 'cursor-pointer hover:bg-gray-100/20' : ''}`}
                        onClick={() => {
                          if (hasLinks) {
                            const newExpanded = new Set(expandedActivities)
                            if (isExpanded) {
                              newExpanded.delete(activity.id)
                            } else {
                              newExpanded.add(activity.id)
                            }
                            setExpandedActivities(newExpanded)
                          }
                        }}>
                        <div className="flex items-center gap-2">
                          {hasLinks && (
                            <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                          )}
                          <span className="font-medium">{activity.name}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>
                            Links: <span className="font-mono">{activity.linksFound}</span>
                          </span>
                          {!dryRun && (
                            <>
                              <span className="text-green-600">
                                Converted:{' '}
                                <span className="font-mono">{activity.linksConverted}</span>
                              </span>
                              {activity.failedConversions > 0 && (
                                <span className="text-red-600">
                                  Failed:{' '}
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
                                <th className="max-w-fit pb-1">Location</th>
                                <th className="w-auto pb-1">Original URL</th>
                                {!dryRun && <th className="w-1/4 pb-1 text-center">Status</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {activity.linkDetails.map((link, index) => (
                                <tr key={index} className="border-b last:border-b-0">
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
                <h4 className="mb-2 font-semibold text-red-800">Errors:</h4>
                <div className="max-h-32 overflow-y-auto">
                  {overallStatistics.errors.map((error, index) => (
                    <div key={index} className="mb-1 text-red-600">
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
              <Button onClick={handleClose} buttonStyle="secondary" disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleFetchLegacyDocs} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : dryRun ? 'Scan All' : 'Migrate All'}
              </Button>
            </>
          ) : (
            <>
              {dryRun && overallStatistics && overallStatistics.totalLinksFound > 0 && (
                <Button
                  onClick={() => {
                    setDryRun(false)
                    setProcessResults([])
                    setOverallStatistics(null)
                  }}
                  buttonStyle="primary">
                  Proceed with Migration
                </Button>
              )}
              <Button onClick={handleReset} buttonStyle="secondary">
                Process More
              </Button>
              <Button
                onClick={handleClose}
                buttonStyle={
                  dryRun || (overallStatistics && overallStatistics.linksConverted === 0)
                    ? 'secondary'
                    : 'primary'
                }>
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
