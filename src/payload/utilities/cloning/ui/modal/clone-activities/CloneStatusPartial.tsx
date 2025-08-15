import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { CloneResultsTable } from './CloneResultsTable'

interface CloneStatusPartialProps {
  results: GenericCloneStatisticsFinalized
}

export const CloneStatusPartial: React.FC<CloneStatusPartialProps> = ({ results }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  // Separate successful and problematic entities
  const successfulEntities = results.entities.filter(
    (entity) => entity.percentComplete === 100 && entity.errors.missingDocumentFiles.length === 0,
  )
  const problematicEntities = results.entities.filter(
    (entity) => entity.percentComplete < 100 || entity.errors.missingDocumentFiles.length > 0,
  )

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--theme-warning)] bg-[var(--theme-warning-50)] p-4">
        <AlertTriangle className="h-6 w-6 text-[var(--theme-warning)]" />
        <div>
          <p className="text-lg font-semibold text-[var(--theme-warning-dark)]">
            {t('cloneActivity:status:partialSuccess', {
              succeeded: successfulEntities.length,
              failed: problematicEntities.length,
            })}
          </p>
        </div>
      </div>

      {/* Successful Results */}
      {successfulEntities.length > 0 && (
        <div className="rounded-lg border border-[var(--theme-success-light)] bg-[var(--theme-success-50)] p-4">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[var(--theme-success)]" />
            <p className="text-lg font-semibold text-[var(--theme-success-dark)]">
              {t('cloneActivity:status:successfullyCloned')}
            </p>
          </div>

          <div className="space-y-4">
            {successfulEntities.map((entity, idx) => (
              <div key={idx} className="rounded border border-[var(--theme-success-light)] bg-[var(--theme-elevation-0)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium text-[var(--theme-text)]">{entity.source.name}</h4>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-[var(--theme-success)]" />
                    <span className="text-sm font-semibold text-[var(--theme-success)]">100% {t('cloneActivity:results:complete')}</span>
                  </div>
                </div>
                <CloneResultsTable statistics={entity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problematic Results */}
      {problematicEntities.length > 0 && (
        <div className="rounded-lg border border-[var(--theme-warning-light)] bg-[var(--theme-warning-50)] p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--theme-warning)]" />
            <p className="text-lg font-semibold text-[var(--theme-warning-dark)]">
              {t('cloneActivity:status:withIssues')}
            </p>
          </div>

          <div className="space-y-4">
            {problematicEntities.map((entity, idx) => {
              const completionIcon =
                entity.percentComplete >= 80 ? (
                  <AlertTriangle className="h-5 w-5 text-[var(--theme-warning)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[var(--theme-error)]" />
                )

              const completionColor =
                entity.percentComplete >= 80 ? 'text-[var(--theme-warning)]' : 'text-[var(--theme-error)]'

              return (
                <div key={idx} className="rounded border border-[var(--theme-warning-light)] bg-[var(--theme-elevation-0)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-[var(--theme-text)]">{entity.source.name}</h4>
                    <div className="flex items-center gap-1">
                      {completionIcon}
                      <span className={`text-sm font-semibold ${completionColor}`}>
                        {entity.percentComplete.toFixed(1)}% {t('cloneActivity:results:complete')}
                      </span>
                    </div>
                  </div>

                  <CloneResultsTable statistics={entity} />

                  {/* Missing Files */}
                  {entity.errors.missingDocumentFiles.length > 0 && (
                    <div className="mt-3 rounded border border-[var(--theme-warning)] bg-[var(--theme-warning-50)] p-2">
                      <p className="text-sm font-medium text-[var(--theme-warning-dark)]">
                        ⚠️ {entity.errors.missingDocumentFiles.length} missing document file(s)
                      </p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-[var(--theme-warning)] hover:text-[var(--theme-warning-darker)]">
                          View detailed errors
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-[var(--theme-warning)]">
                          {entity.errors.missingDocumentFiles.slice(0, 3).map((error, errorIdx) => (
                            <li key={errorIdx}>
                              • {error.fileName} ({error.usageLocation})
                            </li>
                          ))}
                          {entity.errors.missingDocumentFiles.length > 3 && (
                            <li className="italic">
                              ... and {entity.errors.missingDocumentFiles.length - 3} more
                            </li>
                          )}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
