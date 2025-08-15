import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types'
import { GenericCloneStatistics } from '@/payload/utilities/cloning/types'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface CloneResultsTableProps {
  statistics: GenericCloneStatistics
}

export const CloneResultsTable: React.FC<CloneResultsTableProps> = ({ statistics }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  // Calculate missing files count
  const missingFilesCount = statistics.errors.missingDocumentFiles.length

  // Determine completion status color
  const getCompletionColor = (percent: number) => {
    if (percent === 100) return 'text-[var(--theme-success)]'
    if (percent >= 80) return 'text-[var(--theme-warning)]'
    return 'text-[var(--theme-error)]'
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
      <table className="min-w-full border-collapse bg-[var(--theme-elevation-0)]">
        <thead className="bg-[var(--theme-elevation-50)]">
          <tr>
            <th className="border-b border-[var(--theme-border)] px-4 py-2 text-left text-sm font-semibold text-[var(--theme-text)]">
              {t('cloneActivity:table:metric')}
            </th>
            <th className="border-b border-[var(--theme-border)] px-4 py-2 text-center text-sm font-semibold text-[var(--theme-text)]">
              {t('cloneActivity:table:source')}
            </th>
            <th className="border-b border-[var(--theme-border)] px-4 py-2 text-center text-sm font-semibold text-[var(--theme-text)]">
              {t('cloneActivity:table:clone')}
            </th>
            <th className="border-b border-[var(--theme-border)] px-4 py-2 text-center text-sm font-semibold text-[var(--theme-text)]">
              {t('cloneActivity:table:status')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--theme-border)]">
          <tr className="hover:bg-[var(--theme-elevation-50)]">
            <td className="px-4 py-2 text-sm text-[var(--theme-text)]">ID</td>
            <td className="px-4 py-2 text-center text-sm">{statistics.source.id}</td>
            <td className="px-4 py-2 text-center text-sm">{statistics.cloned.id}</td>
            <td className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1">
                {statistics.percentComplete === 100 ? (
                  <CheckCircle className="h-4 w-4 text-[var(--theme-success)]" />
                ) : statistics.percentComplete >= 80 ? (
                  <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[var(--theme-error)]" />
                )}
                <span
                  className={`text-sm font-medium ${getCompletionColor(statistics.percentComplete)}`}>
                  {statistics.percentComplete.toFixed(1)}%
                </span>
              </div>
            </td>
          </tr>

          <tr className="hover:bg-[var(--theme-elevation-50)]">
            <td className="px-4 py-2 text-sm text-[var(--theme-text)]">
              {t('cloneActivity:table:relatedEntities')}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.source.relatedEntitiesCount}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.cloned.relatedEntitiesCount}
            </td>
            <td className="px-4 py-2 text-center">
              {statistics.source.relatedEntitiesCount === statistics.cloned.relatedEntitiesCount ? (
                <CheckCircle className="h-4 w-4 text-[var(--theme-success)]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />
              )}
            </td>
          </tr>

          <tr className="hover:bg-[var(--theme-elevation-50)]">
            <td className="px-4 py-2 text-sm text-[var(--theme-text)]">
              {t('cloneActivity:table:directFileAttachments')}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.source.documentFilesCount}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.cloned.documentFilesCount}
            </td>
            <td className="px-4 py-2 text-center">
              {statistics.source.documentFilesCount === statistics.cloned.documentFilesCount ? (
                <CheckCircle className="h-4 w-4 text-[var(--theme-success)]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />
              )}
            </td>
          </tr>

          <tr className="hover:bg-[var(--theme-elevation-50)]">
            <td className="px-4 py-2 text-sm text-[var(--theme-text)]">
              {t('cloneActivity:table:publicDocuments')}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.source.publicDocumentFilesCount}
            </td>
            <td className="px-4 py-2 text-center text-sm">
              {statistics.cloned.publicDocumentFilesCount}
            </td>
            <td className="px-4 py-2 text-center">
              {statistics.source.publicDocumentFilesCount ===
              statistics.cloned.publicDocumentFilesCount ? (
                <CheckCircle className="h-4 w-4 text-[var(--theme-success)]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />
              )}
            </td>
          </tr>

          {/* Missing Files Row - only show if there are missing files */}
          {missingFilesCount > 0 && (
            <tr className="bg-[var(--theme-warning-50)] hover:bg-[var(--theme-warning-100)]">
              <td className="px-4 py-2 text-sm font-medium text-[var(--theme-warning-dark)]">
                {t('cloneActivity:table:missingFiles')}
              </td>
              <td className="px-4 py-2 text-center text-sm text-[var(--theme-text-light)]">-</td>
              <td className="px-4 py-2 text-center text-sm font-medium text-[var(--theme-warning)]">
                {missingFilesCount}
              </td>
              <td className="px-4 py-2 text-center">
                <AlertTriangle className="h-4 w-4 text-[var(--theme-warning)]" />
              </td>
            </tr>
          )}

          {/* Other Errors Row - only show if there are other errors */}
          {statistics.errors.otherErrors.length > 0 && (
            <tr className="bg-[var(--theme-error-50)] hover:bg-[var(--theme-error-100)]">
              <td className="px-4 py-2 text-sm font-medium text-[var(--theme-error-dark)]">
                {t('cloning:systemErrors')}
              </td>
              <td className="px-4 py-2 text-center text-sm text-[var(--theme-text-light)]">-</td>
              <td className="px-4 py-2 text-center text-sm font-medium text-[var(--theme-error)]">
                {statistics.errors.otherErrors.length}
              </td>
              <td className="px-4 py-2 text-center">
                <XCircle className="h-4 w-4 text-[var(--theme-error)]" />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
