import React from 'react'
import { Select, useTranslation } from '@payloadcms/ui'

// Type for React Select option
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

interface LanguageSelectorsProps {
  fromSelectOptions: Array<{ value: string; label: string }>
  toSelectOptions: Array<{ value: string; label: string }>
  selectedFromOption?: { value: string; label: string }
  selectedToOption?: { value: string; label: string }
  onFromSelectChange: (option: Option<unknown> | Option<unknown>[]) => void
  onToSelectChange: (option: Option<unknown> | Option<unknown>[]) => void
  disabled?: boolean
}

export const LanguageSelectors: React.FC<LanguageSelectorsProps> = ({
  fromSelectOptions,
  toSelectOptions,
  selectedFromOption,
  selectedToOption,
  onFromSelectChange,
  onToSelectChange,
  disabled = false,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex w-full items-center gap-4">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">
          {t('plugin-deepltranslate:resolver_deepl_translateFrom' as any)}
        </label>
        <Select
          options={fromSelectOptions}
          value={selectedFromOption}
          onChange={onFromSelectChange}
          isCreatable={false}
          isClearable={false}
          isMulti={false}
          isSearchable={false}
          disabled={disabled}
        />
      </div>

      <div className="p-2 text-center text-2xl">→</div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">
          {t('plugin-deepltranslate:resolver_deepl_translateTo' as any)}
        </label>
        <Select
          options={toSelectOptions}
          value={selectedToOption}
          onChange={onToSelectChange}
          isCreatable={false}
          isClearable={false}
          isMulti={false}
          isSearchable={false}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
