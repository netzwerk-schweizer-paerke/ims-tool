import { useTranslation } from '@payloadcms/ui'

import type { DeepLTranslationKeys, DeepLTranslationsObject } from '../../../i18n-types'

interface TranslationOptionsProps {
  disabled?: boolean
  includeRelationships: boolean
  onIncludeRelationshipsChange: (checked: boolean) => void
}

export const TranslationOptions = ({
  disabled = false,
  includeRelationships,
  onIncludeRelationshipsChange,
}: TranslationOptionsProps) => {
  const { t } = useTranslation<DeepLTranslationsObject, DeepLTranslationKeys>()

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
        <span className="">{t('plugin-deepltranslate:resolver_deepl_includeRelated')}</span>
      </label>
      <p className="ml-6 mt-1 italic text-[var(--theme-elevation-600)]">
        {t('plugin-deepltranslate:resolver_deepl_includeRelatedHelp')}
      </p>
    </div>
  )
}
