import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'
import { CloneSuccessResult } from './CloneSuccessResult'

interface CloneStatusSuccessProps {
  results: Array<{
    activityId: number
    activityName: string
    statistics: CloneStatistics
  }>
}

export const CloneStatusSuccess: React.FC<CloneStatusSuccessProps> = ({ results }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const hasWarnings = results.some((r) => r.statistics?.completeness?.percentComplete < 100)

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      {hasWarnings ? (
        <div className="flex items-center rounded border border-yellow-600 p-4 text-xl">
          <div>
            <p className="mb-4 font-semibold text-yellow-600">
              ⚠️ {t('cloneActivity:status:withWarnings' as any)}
            </p>
            <p className="mb-4">{t('cloneActivity:status:withWarningsDescription' as any)}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center rounded border border-green-600 p-4 text-xl">
          <p className="font-semibold text-green-600">
            ✅ {t('cloneActivity:status:allSuccess' as any)}
          </p>
        </div>
      )}

      {/* Results */}
      <div>
        {results.map((result, idx) => (
          <CloneSuccessResult
            key={idx}
            activityName={result.activityName}
            activityId={result.activityId}
            statistics={result.statistics}
          />
        ))}
      </div>
    </div>
  )
}
