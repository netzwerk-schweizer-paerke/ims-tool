import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'
import { ClonePartialResultsTable } from './ClonePartialResultsTable'
import { CloneMissingFiles } from './CloneMissingFiles'

interface CloneStatusPartialProps {
  successResults: Array<{
    activityId: number
    activityName: string
    statistics: CloneStatistics
  }>
  failedResults: Array<{
    activityId: string
    activityName: string
    error: string
  }>
}

export const CloneStatusPartial: React.FC<CloneStatusPartialProps> = ({
  successResults,
  failedResults,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="flex items-center rounded border border-yellow-600 p-4 text-xl">
        <p className="font-semibold text-yellow-600">
          ⚠️{' '}
          {t('cloneActivity:status:partialSuccess' as any, {
            succeeded: successResults.length,
            failed: failedResults.length,
          })}
        </p>
      </div>

      {/* Successful Results */}
      {successResults.length > 0 && (
        <div className="rounded border border-green-600 p-4">
          <p className="mb-3 text-xl font-semibold text-green-600">
            ✅ {t('cloneActivity:status:successfullyCloned' as any)}
          </p>
          {successResults.map((result, idx) => (
            <div key={idx} className="mt-4 border-b border-gray-200 pb-4 last:border-0">
              <p className="mb-3 text-lg font-semibold">
                {result.activityName} → Activity #{result.activityId}
              </p>

              {result.statistics && (
                <div className="space-y-3">
                  {/* Summary Table */}
                  <div className="pl-4">
                    <p className="mb-2 font-medium">
                      {t('cloneActivity:results:activityComparison' as any)}
                    </p>
                    <ClonePartialResultsTable statistics={result.statistics} />
                  </div>

                  <CloneMissingFiles errors={result.statistics.errors?.missingFiles || []} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Failed Results */}
      {failedResults.length > 0 && (
        <div className="rounded border border-red-600 p-4">
          <p className="mb-2 text-xl font-semibold text-red-600">
            ❌ {t('cloneActivity:status:failedToClone' as any)}
          </p>
          {failedResults.map((fail, idx) => (
            <div key={idx} className="ml-4 mt-2">
              <p className="text-red-600">
                <strong>{fail.activityName}</strong>: {fail.error}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
