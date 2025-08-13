import React from 'react'
import { useTranslation } from '@payloadcms/ui'

interface TranslationOptionsProps {
  includeRelationships: boolean
  onIncludeRelationshipsChange: (checked: boolean) => void
  disabled?: boolean
}

export const TranslationOptions: React.FC<TranslationOptionsProps> = ({
  includeRelationships,
  onIncludeRelationshipsChange,
  disabled = false,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={includeRelationships}
          onChange={(e) => onIncludeRelationshipsChange(e.target.checked)}
          className="cursor-pointer"
          disabled={disabled}
        />
        <span className="text-sm">
          {t('plugin-deepltranslate:resolver_deepl_includeRelated' as any)}
        </span>
      </label>
      <p className="ml-6 mt-1 text-xs italic text-[var(--theme-elevation-600)]">
        {t('plugin-deepltranslate:resolver_deepl_includeRelatedHelp' as any)}
      </p>
    </div>
  )
}
