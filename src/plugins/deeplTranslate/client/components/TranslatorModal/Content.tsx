import { getTranslation } from '@payloadcms/translations'
import { Button, Select, useTranslation } from '@payloadcms/ui'
import { useTranslator } from '@/plugins/deeplTranslate/client/providers/Translator/context'
import { useMemo, useState } from 'react'

// Is not exported for React Select
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

export const Content: React.FC = () => {
  const [busy, setBusy] = useState(false)
  const {
    localesOptions,
    localeToTranslateFrom: localeCodeToTranslateFrom,
    resolverT,
    setLocaleToTranslateFrom,
    submit,
  } = useTranslator()

  const { i18n } = useTranslation()

  const selectOptions = useMemo(
    () =>
      localesOptions.map((option) => {
        const label = getTranslation(option.label, i18n)
        return {
          value: option.code,
          label: label !== option.code ? `${label} (${option.code})` : label,
        }
      }),
    [localesOptions, i18n],
  )

  const selectedOption = useMemo(
    () => selectOptions.find((option) => option.value === localeCodeToTranslateFrom),
    [selectOptions, localeCodeToTranslateFrom],
  )

  const onSelectChange = (option: Option<unknown> | Option<unknown>[]) => {
    if (!Array.isArray(option) && option?.value) {
      setLocaleToTranslateFrom(option.value as string)
    }
  }

  const onClickTranslate = async () => {
    setBusy(true)
    try {
      await submit({ emptyOnly: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="deepltranslate__content">
      <h2>{resolverT('modalTitle')}</h2>
      <div className="deepltranslate__select-container">
        <Select
          options={selectOptions}
          value={selectedOption}
          onChange={onSelectChange}
          isCreatable={false}
          isClearable={false}
          isMulti={false}
          isSearchable={false}
        />
      </div>
      <div className="deepltranslate__buttons">
        <Button onClick={onClickTranslate} disabled={busy}>
          {resolverT('submitButtonLabelFull')}
        </Button>
      </div>
      {busy && <div>{resolverT('pleaseWait')}</div>}
    </div>
  )
}
