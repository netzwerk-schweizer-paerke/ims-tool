import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'
import { CloneResultsTable } from './CloneResultsTable'
import { CloneMissingFiles } from './CloneMissingFiles'

interface CloneSuccessResultProps {
  activityName: string
  activityId: number
  statistics: CloneStatistics
}

export const CloneSuccessResult: React.FC<CloneSuccessResultProps> = ({
  activityName,
  activityId,
  statistics,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div className="mt-4 border-b border-gray-200 pb-4 last:border-0">
      <p className="mb-3 text-lg font-semibold">
        {activityName} → Activity #{activityId}
      </p>

      {statistics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Summary */}
            <div>
              <p className="mb-2 font-medium">{t('cloneActivity:results:summary' as any)}</p>
              <div className="space-y-1 pl-4">
                <p>
                  • {t('cloneActivity:results:completeness' as any)}{' '}
                  <strong
                    className={
                      statistics.completeness.percentComplete === 100
                        ? 'text-green-600'
                        : statistics.completeness.percentComplete >= 80
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }>
                    {statistics.completeness.percentComplete}%
                    {statistics.completeness.percentComplete < 100 && ' ⚠️'}
                  </strong>
                </p>
                <p>
                  • {t('cloneActivity:results:sourceActivity' as any)} #{statistics.source.id} -{' '}
                  {statistics.source.name}
                </p>
                <p>
                  • {t('cloneActivity:results:variant' as any)} {statistics.source.variant}
                </p>
              </div>
            </div>

            {/* Errors/Warnings */}
            {statistics.errors && (
              <>
                <CloneMissingFiles errors={statistics.errors.missingFiles} />
                {statistics.errors.failedTasks.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium text-yellow-600">
                      ⚠️ {t('cloneActivity:results:failedTasks' as any)}
                    </p>
                    <div className="space-y-2 pl-4">
                      {statistics.errors.failedTasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="text-yellow-600">
                          <p>
                            • {t('cloneActivity:results:failedTask' as any)} {task.taskType} #
                            {task.taskId}
                          </p>
                          <p className="pl-4">
                            {t('cloneActivity:results:error' as any)} {task.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Statistics Table */}
          <div>
            <p className="mb-2 font-medium">
              {t('cloneActivity:results:activityComparison' as any)}
            </p>
            <CloneResultsTable statistics={statistics} />
          </div>
        </div>
      )}
    </div>
  )
}
