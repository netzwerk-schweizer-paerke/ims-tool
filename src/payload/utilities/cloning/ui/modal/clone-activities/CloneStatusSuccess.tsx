import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { CloneResultsTable } from './CloneResultsTable'

interface CloneStatusSuccessProps {
  results: GenericCloneStatisticsFinalized
}

export const CloneStatusSuccess: React.FC<CloneStatusSuccessProps> = ({ results }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  // Check if any entities have warnings (incomplete clones)
  const hasWarnings = results.entities.some((entity) => entity.percentComplete < 100)

  // Calculate missing files for aggregated display
  const totalMissingFiles = results.entities.reduce(
    (sum, entity) => sum + entity.errors.missingDocumentFiles.length,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {hasWarnings ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--theme-warning)] bg-[var(--theme-warning-50)] p-4">
          <AlertTriangle className="h-6 w-6 text-[var(--theme-warning)]" />
          <div>
            <p className="mb-2 text-lg font-semibold text-[var(--theme-warning-dark)]">
              {t('cloneActivity:status:withWarnings')}
            </p>
            <p className="text-[var(--theme-warning)]">
              {t('cloneActivity:status:withWarningsDescription')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--theme-success)] bg-[var(--theme-success-50)] p-4">
          <CheckCircle className="h-6 w-6 text-[var(--theme-success)]" />
          <p className="text-lg font-semibold text-[var(--theme-success-dark)]">
            {t('cloneActivity:status:allSuccess')}
          </p>
        </div>
      )}

      {/* Aggregated Summary (if multiple entities) */}
      {results.entities.length > 1 && (
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-elevation-50)] p-4">
          <h3 className="mb-3 text-lg font-semibold text-[var(--theme-text)]">
            {t('cloneActivity:results:summary')}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[var(--theme-text-light)]">
                {t('cloneActivity:table:totalActivities')}
              </span>
              <span className="ml-2">{results.entities.length}</span>
            </div>
            <div>
              <span className="font-medium text-[var(--theme-text-light)]">
                {t('cloneActivity:table:totalRelatedEntities')}
              </span>
              <span className="ml-2">{results.aggregated.cloned.relatedEntitiesCount}</span>
            </div>
            <div>
              <span className="font-medium text-[var(--theme-text-light)]">
                {t('cloneActivity:table:totalDocumentFiles')}
              </span>
              <span className="ml-2">{results.aggregated.cloned.documentFilesCount}</span>
            </div>
            {totalMissingFiles > 0 && (
              <div>
                <span className="font-medium text-[var(--theme-error)]">
                  {t('cloneActivity:table:totalMissingFiles')}
                </span>
                <span className="ml-2 text-[var(--theme-error)]">{totalMissingFiles}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Entity Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--theme-text)]">
          {t('cloneActivity:results:detailedResults')}
        </h3>
        {results.entities.map((entity, idx) => {
          const completionIcon =
            entity.percentComplete === 100 ? (
              <CheckCircle className="h-5 w-5 text-[var(--theme-success)]" />
            ) : entity.percentComplete >= 80 ? (
              <AlertTriangle className="h-5 w-5 text-[var(--theme-warning)]" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[var(--theme-error)]" />
            )

          const completionColor =
            entity.percentComplete === 100
              ? 'text-[var(--theme-success)]'
              : entity.percentComplete >= 80
                ? 'text-[var(--theme-warning)]'
                : 'text-[var(--theme-error)]'

          return (
            <div key={idx} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-elevation-0)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-medium text-[var(--theme-text)]">{entity.source.name}</h4>
                <div className="flex items-center gap-2">
                  {completionIcon}
                  <span className={`font-semibold ${completionColor}`}>
                    {entity.percentComplete.toFixed(1)}% {t('cloneActivity:results:complete')}
                  </span>
                </div>
              </div>

              {/* Entity Statistics Table */}
              <CloneResultsTable statistics={entity} />

              {/* Missing Files Warning */}
              {entity.errors.missingDocumentFiles.length > 0 && (
                <div className="mt-4 rounded border border-[var(--theme-warning-light)] bg-[var(--theme-warning-50)] p-3">
                  <p className="text-sm font-medium text-[var(--theme-warning-dark)]">
                    ⚠️ {entity.errors.missingDocumentFiles.length} missing file(s) detected
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-[var(--theme-warning)] hover:text-[var(--theme-warning-darker)]">
                      Show details
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--theme-warning-dark)]">
                      {entity.errors.missingDocumentFiles.map((error, errorIdx) => (
                        <li key={errorIdx}>
                          • {error.fileName} in {error.documentName} ({error.usageLocation})
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
