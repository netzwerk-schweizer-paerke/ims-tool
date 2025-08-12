import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'

interface CloneStatusErrorProps {
  failedResults: Array<{
    activityId: string
    activityName: string
    error: string
  }>
}

export const CloneStatusError: React.FC<CloneStatusErrorProps> = ({ failedResults }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div className="space-y-4">
      <div className="flex items-center rounded border border-red-600 p-4 text-xl">
        <div>
          <p className="mb-2 font-semibold text-red-600">
            ❌ {t('cloneActivity:status:allFailed' as any)}
          </p>
          {failedResults.map((fail, idx) => (
            <div key={idx} className="ml-4 mt-2">
              <p className="text-red-600">
                <strong>{fail.activityName}</strong>: {fail.error}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
