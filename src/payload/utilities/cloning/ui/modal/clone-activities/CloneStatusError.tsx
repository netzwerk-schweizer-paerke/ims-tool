import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { CloneResultsTable } from './CloneResultsTable'

interface CloneStatusErrorProps {
  results: GenericCloneStatisticsFinalized
}

export const CloneStatusError: React.FC<CloneStatusErrorProps> = ({ results }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  // Separate successfully cloned entities from failed ones
  const successfullyClonedEntities = results.entities.filter(
    (entity) => entity.cloned.id && entity.cloned.id !== 0 && entity.cloned.id !== '0'
  )
  
  const completelyFailedEntities = results.entities.filter(
    (entity) => !entity.cloned.id || entity.cloned.id === 0 || entity.cloned.id === '0'
  )

  // Find entities with critical errors (system failures, low completion rates for successfully cloned entities)
  const criticalErrorEntities = successfullyClonedEntities.filter(
    (entity) => entity.percentComplete < 80 || entity.errors.otherErrors.length > 0
  )

  return (
    <div className="space-y-6">
      {/* Main Status Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--theme-error)] bg-[var(--theme-error-50)] p-4">
        <XCircle className="h-6 w-6 text-[var(--theme-error)]" />
        <div>
          {successfullyClonedEntities.length > 0 ? (
            <>
              <p className="text-lg font-semibold text-[var(--theme-error-dark)]">
                {t('cloneActivity:status:partialSuccess', {
                  succeeded: successfullyClonedEntities.length,
                  failed: completelyFailedEntities.length,
                })}
              </p>
              <p className="text-[var(--theme-error)]">
                {successfullyClonedEntities.length} of {results.entities.length} activities were cloned successfully
                {criticalErrorEntities.length > 0 && `, but ${criticalErrorEntities.length} have significant issues`}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-[var(--theme-error-dark)]">
                {t('cloneActivity:status:allFailed')}
              </p>
              <p className="text-[var(--theme-error)]">
                All {results.entities.length} activities failed to clone properly
              </p>
            </>
          )}
        </div>
      </div>

      {/* Successfully Cloned Activities with Minor Issues */}
      {successfullyClonedEntities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[var(--theme-success)]" />
            <h3 className="text-lg font-semibold text-[var(--theme-success-dark)]">
              {t('cloneActivity:status:successfullyCloned')} ({successfullyClonedEntities.length})
            </h3>
          </div>

          {successfullyClonedEntities.map((entity, idx) => {
            const hasWarnings = entity.errors.missingDocumentFiles.length > 0
            const hasCriticalErrors = entity.percentComplete < 80 || entity.errors.otherErrors.length > 0
            
            const borderColor = hasCriticalErrors 
              ? 'border-[var(--theme-error-light)]'
              : hasWarnings 
                ? 'border-[var(--theme-warning-light)]'
                : 'border-[var(--theme-success-light)]'
                
            const bgColor = hasCriticalErrors 
              ? 'bg-[var(--theme-error-50)]'
              : hasWarnings 
                ? 'bg-[var(--theme-warning-50)]'
                : 'bg-[var(--theme-success-50)]'

            return (
              <div key={idx} className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-lg font-medium text-[var(--theme-text)]">{entity.source.name}</h4>
                  <div className="flex items-center gap-2">
                    {hasCriticalErrors ? (
                      <XCircle className="h-5 w-5 text-[var(--theme-error)]" />
                    ) : hasWarnings ? (
                      <AlertTriangle className="h-5 w-5 text-[var(--theme-warning)]" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-[var(--theme-success)]" />
                    )}
                    <span className={`font-semibold ${
                      hasCriticalErrors ? 'text-[var(--theme-error)]' :
                      hasWarnings ? 'text-[var(--theme-warning)]' : 'text-[var(--theme-success)]'
                    }`}>
                      {entity.percentComplete.toFixed(1)}% {t('cloneActivity:results:complete')}
                    </span>
                  </div>
                </div>

                {/* Cloned ID Display */}
                <div className="mb-3 text-sm text-[var(--theme-text-light)]">
                  <span className="font-medium">Cloned Activity ID:</span> {entity.cloned.id}
                </div>

                {/* Statistics Table */}
                <CloneResultsTable statistics={entity} />

                {/* System Error Messages */}
                {entity.errors.otherErrors.length > 0 && (
                  <div className="mt-4 rounded border border-[var(--theme-error-light)] bg-[var(--theme-error-50)] p-3">
                    <p className="mb-2 text-sm font-medium text-[var(--theme-error-dark)]">
                      {t('cloning:systemErrors')} ({entity.errors.otherErrors.length})
                    </p>
                    <ul className="space-y-1 text-sm text-[var(--theme-error)]">
                      {entity.errors.otherErrors.map((error, errorIdx) => (
                        <li key={errorIdx}>
                          • <strong>{error.op}:</strong> {error.errorMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Document Files with HTTP Status */}
                {entity.errors.missingDocumentFiles.length > 0 && (
                  <div className="mt-4 rounded border border-[var(--theme-warning-light)] bg-[var(--theme-warning-50)] p-3">
                    <p className="mb-2 text-sm font-medium text-[var(--theme-warning-dark)]">
                      ⚠️ {entity.errors.missingDocumentFiles.length} missing document file(s)
                    </p>
                    <div className="space-y-2">
                      {entity.errors.missingDocumentFiles.slice(0, 8).map((error, errorIdx) => {
                        // Extract HTTP status code from error message
                        const httpStatusMatch = error.error.match(/(\d{3})/);
                        const statusCode = httpStatusMatch ? httpStatusMatch[1] : 'Unknown';
                        const statusLabel = statusCode === '403' ? 'Forbidden' : 
                                          statusCode === '404' ? 'Not Found' : 
                                          statusCode === '500' ? 'Server Error' : 
                                          statusCode;

                        return (
                          <div key={errorIdx} className="text-sm border-l-2 border-[var(--theme-warning)] pl-3">
                            <div className="font-medium text-[var(--theme-warning-dark)]">
                              {error.fileName}
                            </div>
                            <div className="text-xs text-[var(--theme-warning)]">
                              Document: <span className="font-medium">{error.documentName}</span> • 
                              Location: <span className="font-medium">{error.usageLocation}</span>
                            </div>
                            <div className="text-xs text-[var(--theme-error)]">
                              HTTP {statusCode} ({statusLabel}): {error.error}
                            </div>
                          </div>
                        )
                      })}
                      {entity.errors.missingDocumentFiles.length > 8 && (
                        <div className="text-xs italic text-[var(--theme-warning)]">
                          ... and {entity.errors.missingDocumentFiles.length - 8} more missing files
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Completely Failed Entities */}
      {completelyFailedEntities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-[var(--theme-error)]" />
            <h3 className="text-lg font-semibold text-[var(--theme-error-dark)]">
              {t('cloneActivity:status:failedToClone')} ({completelyFailedEntities.length})
            </h3>
          </div>

          {completelyFailedEntities.map((entity, idx) => (
            <div key={idx} className="rounded-lg border border-[var(--theme-error-light)] bg-[var(--theme-error-50)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-lg font-medium text-[var(--theme-text)]">{entity.source.name}</h4>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-[var(--theme-error)]" />
                  <span className="font-semibold text-[var(--theme-error)]">Clone Failed</span>
                </div>
              </div>

              {/* Error Messages for Failed Clones */}
              {entity.errors.otherErrors.length > 0 && (
                <div className="rounded border border-[var(--theme-error-light)] bg-[var(--theme-error-50)] p-3">
                  <p className="mb-2 text-sm font-medium text-[var(--theme-error-dark)]">
                    {t('cloning:systemErrors')}
                  </p>
                  <ul className="space-y-1 text-sm text-[var(--theme-error)]">
                    {entity.errors.otherErrors.map((error, errorIdx) => (
                      <li key={errorIdx}>
                        • <strong>{error.op}:</strong> {error.errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}