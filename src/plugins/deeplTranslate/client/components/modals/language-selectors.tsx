import { Select, useTranslation } from '@payloadcms/ui'
import React from 'react'

interface LanguageSelectorsProps {
  disabled?: boolean
  fromSelectOptions: Array<{ label: string; value: string; }>
  onFromSelectChange: (option: Option<unknown> | Option<unknown>[]) => void
  onToSelectChange: (option: Option<unknown> | Option<unknown>[]) => void
  selectedFromOption?: { label: string; value: string; }
  selectedToOption?: { label: string; value: string; }
  toSelectOptions: Array<{ label: string; value: string; }>
}

// Type for React Select option
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

export const LanguageSelectors: React.FC<LanguageSelectorsProps> = ({
  disabled = false,
  fromSelectOptions,
  onFromSelectChange,
  onToSelectChange,
  selectedFromOption,
  selectedToOption,
  toSelectOptions,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex w-full items-center gap-4">
      <div className="flex-1">
        <label className="mb-2 block font-medium">
          {t('plugin-deepltranslate:resolver_deepl_translateFrom' as any)}
        </label>
        <Select
          disabled={disabled}
          isClearable={false}
          isCreatable={false}
          isMulti={false}
          isSearchable={false}
          onChange={onFromSelectChange}
          options={fromSelectOptions}
          value={selectedFromOption}
        />
      </div>

      <div className="p-2 text-center text-2xl">→</div>

      <div className="flex-1">
        <label className="mb-2 block font-medium">
          {t('plugin-deepltranslate:resolver_deepl_translateTo' as any)}
        </label>
        <Select
          disabled={disabled}
          isClearable={false}
          isCreatable={false}
          isMulti={false}
          isSearchable={false}
          onChange={onToSelectChange}
          options={toSelectOptions}
          value={selectedToOption}
        />
      </div>
    </div>
  )
}
