import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'

interface ClonePartialResultsTableProps {
  statistics: CloneStatistics
}

export const ClonePartialResultsTable: React.FC<ClonePartialResultsTableProps> = ({
  statistics,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <table className="ml-4 min-w-[400px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="p-2 text-left font-medium">{t('cloneActivity:table:metric' as any)}</th>
          <th className="p-2 text-center font-medium">{t('cloneActivity:table:source' as any)}</th>
          <th className="p-2 text-center font-medium">{t('cloneActivity:table:clone' as any)}</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-200">
          <td className="p-2">{t('cloneActivity:table:completeness' as any)}</td>
          <td className="p-2 text-center">-</td>
          <td className="p-2 text-center">
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
          </td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="p-2">{t('cloneActivity:table:directFileAttachments' as any)}</td>
          <td className="p-2 text-center">{statistics.source.filesCount}</td>
          <td className="p-2 text-center">{statistics.cloned.documentsCloned}</td>
        </tr>
        {(statistics.source.richTextDocumentsFound !== undefined ||
          statistics.cloned.richTextDocumentsCloned !== undefined) && (
          <tr className="border-b border-gray-200">
            <td className="p-2">{t('cloneActivity:table:richTextDocuments' as any)}</td>
            <td className="p-2 text-center">{statistics.source.richTextDocumentsFound ?? 0}</td>
            <td className="p-2 text-center">{statistics.cloned.richTextDocumentsCloned ?? 0}</td>
          </tr>
        )}
        {(statistics.source.publicDocumentsFound !== undefined ||
          statistics.cloned.publicDocumentsPreserved !== undefined) && (
          <tr className="border-b border-gray-200">
            <td className="p-2">{t('cloneActivity:table:publicDocuments' as any)}</td>
            <td className="p-2 text-center">{statistics.source.publicDocumentsFound ?? 0}</td>
            <td className="p-2 text-center">{statistics.cloned.publicDocumentsPreserved ?? 0}</td>
          </tr>
        )}
        {(statistics.source.totalDocumentsFound !== undefined ||
          statistics.cloned.totalDocumentsCloned !== undefined) && (
          <tr className="border-b border-gray-200 font-semibold">
            <td className="p-2">{t('cloneActivity:table:totalDocumentUsages' as any)}</td>
            <td className="p-2 text-center">{statistics.source.totalDocumentsFound ?? '-'}</td>
            <td className="p-2 text-center">{statistics.cloned.totalDocumentsCloned ?? '-'}</td>
          </tr>
        )}
        {(statistics.source.uniqueDocumentsFound !== undefined ||
          statistics.cloned.uniqueDocumentsCloned !== undefined) && (
          <tr className="border-b border-gray-200">
            <td className="p-2">{t('cloneActivity:table:uniqueDocuments' as any)}</td>
            <td className="p-2 text-center">{statistics.source.uniqueDocumentsFound ?? '-'}</td>
            <td className="p-2 text-center">{statistics.cloned.uniqueDocumentsCloned ?? '-'}</td>
          </tr>
        )}
        <tr className="border-b border-gray-200">
          <td className="p-2">{t('cloneActivity:table:taskFlows' as any)}</td>
          <td className="p-2 text-center">{statistics.source.taskFlowsCount ?? '-'}</td>
          <td className="p-2 text-center">{statistics.cloned.taskFlowsCloned}</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="p-2">{t('cloneActivity:table:taskLists' as any)}</td>
          <td className="p-2 text-center">{statistics.source.taskListsCount ?? '-'}</td>
          <td className="p-2 text-center">{statistics.cloned.taskListsCloned}</td>
        </tr>
        {(statistics.source.taskFlowBlocksCount !== undefined ||
          statistics.cloned.taskFlowBlocksCloned !== undefined) && (
          <tr className="border-b border-gray-200">
            <td className="p-2">{t('cloneActivity:table:taskFlowBlocks' as any)}</td>
            <td className="p-2 text-center">{statistics.source.taskFlowBlocksCount ?? '-'}</td>
            <td className="p-2 text-center">{statistics.cloned.taskFlowBlocksCloned ?? '-'}</td>
          </tr>
        )}
        {(statistics.source.taskListBlocksCount !== undefined ||
          statistics.cloned.taskListBlocksCloned !== undefined) && (
          <tr className="border-b border-gray-200">
            <td className="p-2">{t('cloneActivity:table:taskListBlocks' as any)}</td>
            <td className="p-2 text-center">{statistics.source.taskListBlocksCount ?? '-'}</td>
            <td className="p-2 text-center">{statistics.cloned.taskListBlocksCloned ?? '-'}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
