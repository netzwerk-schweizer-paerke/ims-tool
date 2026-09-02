import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { MissingDocumentFileError } from '@/payload/utilities/cloning/types'

interface CloneMissingFilesProps {
  errors: MissingDocumentFileError[]
}

export const CloneMissingFiles: React.FC<CloneMissingFilesProps> = ({ errors }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  if (!errors || errors.length === 0) {
    return null
  }

  return (
    <div className="pl-4">
      <p className="mb-2 font-medium text-[var(--theme-warning)]">
        ⚠️ {t('cloneActivity:results:missingDocuments')}
      </p>
      <div className="space-y-3 pl-4">
        {errors.map((file, fileIdx) => (
          <div className="ml-2 border-l-2 border-[var(--theme-warning)] pl-3" key={fileIdx}>
            <p className="font-medium text-[var(--theme-text)]">
              {file.documentName || `Document #${file.documentId}`}
            </p>
            <div className="mt-1 space-y-1 pl-2">
              <p className="">
                <span className="font-medium">{t('cloneActivity:results:file')}</span>{' '}
                {file.fileName || 'Unknown'}
              </p>
              {file.usageLocation && (
                <div className="">
                  <span className="font-medium">
                    {t('cloneActivity:results:usageInformation')}
                  </span>
                  {file.usageLocation.startsWith('{') || file.usageLocation.startsWith('[') ? (
                    <pre className="mt-1 overflow-x-auto rounded bg-[var(--theme-elevation-50)] p-2">
                      {file.usageLocation}
                    </pre>
                  ) : (
                    <span className="ml-1">{file.usageLocation}</span>
                  )}
                </div>
              )}
              <p className="text-[var(--theme-error)]">
                <span className="font-medium">{t('cloneActivity:results:error')}</span>{' '}
                {file.error}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
