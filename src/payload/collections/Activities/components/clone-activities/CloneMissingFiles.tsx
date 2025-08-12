import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'

interface CloneMissingFilesProps {
  errors: CloneStatistics['errors']['missingFiles']
}

export const CloneMissingFiles: React.FC<CloneMissingFilesProps> = ({ errors }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  if (!errors || errors.length === 0) {
    return null
  }

  return (
    <div className="pl-4">
      <p className="mb-2 font-medium text-yellow-600">
        ⚠️ {t('cloneActivity:results:missingDocuments' as any)}
      </p>
      <div className="space-y-3 pl-4">
        {errors.map((file, fileIdx) => (
          <div key={fileIdx} className="ml-2 border-l-2 border-yellow-400 pl-3">
            <p className="font-medium text-gray-800">
              {file.documentName || `Document #${file.documentId}`}
            </p>
            <div className="mt-1 space-y-1 pl-2">
              <p className="">
                <span className="font-medium">{t('cloneActivity:results:file' as any)}</span>{' '}
                {file.fileName || 'Unknown'}
              </p>
              {file.usageLocation && (
                <div className="">
                  <span className="font-medium">
                    {t('cloneActivity:results:usageInformation' as any)}
                  </span>
                  {file.usageLocation.startsWith('{') || file.usageLocation.startsWith('[') ? (
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2">
                      {file.usageLocation}
                    </pre>
                  ) : (
                    <span className="ml-1">{file.usageLocation}</span>
                  )}
                </div>
              )}
              <p className="text-red-600">
                <span className="font-medium">{t('cloneActivity:results:error' as any)}</span>{' '}
                {file.error}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
