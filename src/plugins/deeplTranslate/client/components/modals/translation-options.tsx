import { useTranslation } from '@payloadcms/ui'
import React from 'react'

interface TranslationOptionsProps {
  disabled?: boolean
  includeRelationships: boolean
  onIncludeRelationshipsChange: (checked: boolean) => void
}

export const TranslationOptions: React.FC<TranslationOptionsProps> = ({
  disabled = false,
  includeRelationships,
  onIncludeRelationshipsChange,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          checked={includeRelationships}
          className="cursor-pointer"
          disabled={disabled}
          onChange={(e) => onIncludeRelationshipsChange(e.target.checked)}
          type="checkbox"
        />
        <span className="">{t('plugin-deepltranslate:resolver_deepl_includeRelated' as any)}</span>
      </label>
      <p className="ml-6 mt-1 italic text-[var(--theme-elevation-600)]">
        {t('plugin-deepltranslate:resolver_deepl_includeRelatedHelp' as any)}
      </p>
    </div>
  )
}
