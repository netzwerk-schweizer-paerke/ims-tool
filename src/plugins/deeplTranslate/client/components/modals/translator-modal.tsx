import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  CloseMenuIcon,
  Modal,
  toast,
  useConfig,
  useDocumentInfo,
  useLocale,
  usePreferences,
  useTranslation,
} from '@payloadcms/ui'
import { TypedLocale } from 'payload'
import React from 'react'

import { hasLocalization } from '@/lib/locale-utils'

import { translateDocument } from '../../api/translate-api'
import { LanguageSelectors } from './language-selectors'
import { TranslationOptions } from './translation-options'
import { TranslationResult } from './translation-result'
import './styles.scss'

// Type for React Select option
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

interface Props {
  modalSlug: string
  onClose: () => void
}

export const StandaloneTranslatorModal: React.FC<Props> = ({ modalSlug, onClose }) => {
  const [busy, setBusy] = React.useState(false)
  const [selectedFromLocale, setSelectedFromLocale] = React.useState<string>('')
  const [selectedToLocale, setSelectedToLocale] = React.useState<string>('')
  const [includeRelationships, setIncludeRelationships] = React.useState(false)
  const [translationResult, setTranslationResult] = React.useState<null | {
    error?: string
    errorType?: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
    success: boolean
  }>(null)

  const { collectionSlug, globalSlug, id } = useDocumentInfo()
  const locale = useLocale()
  const { i18n, t } = useTranslation()
  const { config } = useConfig()
  const { setPreference } = usePreferences()

  // All available locales
  const allLocales = React.useMemo(() => {
    if (!hasLocalization(config)) return []
    return config.localization.locales
  }, [config])

  React.useEffect(() => {
    // Set defaults: current locale as source, and first available other locale as target
    if (!(hasLocalization(config) && allLocales.length > 0)) {
    	return;
    }

    setSelectedFromLocale(locale.code)
    const otherLocales = allLocales.filter((l) => l.code !== locale.code)
    if (otherLocales.length > 0) {
      setSelectedToLocale(otherLocales[0].code)
    }
  }, [config, allLocales, locale.code])

  // Options for the FROM select (all locales)
  const fromSelectOptions = React.useMemo(
    () =>
      allLocales.map((option) => {
        const label = getTranslation(option.label, i18n)
        return {
          label: label === option.code ? label : `${label} (${option.code})`,
          value: option.code,
        }
      }),
    [allLocales, i18n],
  )

  // Options for the TO select (all locales except the selected FROM locale)
  const toSelectOptions = React.useMemo(
    () =>
      allLocales
        .filter((l) => l.code !== selectedFromLocale)
        .map((option) => {
          const label = getTranslation(option.label, i18n)
          return {
            label: label === option.code ? label : `${label} (${option.code})`,
            value: option.code,
          }
        }),
    [allLocales, selectedFromLocale, i18n],
  )

  const selectedFromOption = React.useMemo(
    () => fromSelectOptions.find((option) => option.value === selectedFromLocale),
    [fromSelectOptions, selectedFromLocale],
  )

  const selectedToOption = React.useMemo(
    () => toSelectOptions.find((option) => option.value === selectedToLocale),
    [toSelectOptions, selectedToLocale],
  )

  const onFromSelectChange = (option: Option<unknown> | Option<unknown>[]) => {
    if (Array.isArray(option) || !option?.value) {
    	return;
    }

    const newFromLocale = option.value as string
    setSelectedFromLocale(newFromLocale)
    // If the new FROM locale is the same as current TO locale, reset TO locale
    if (newFromLocale === selectedToLocale) {
      const otherLocales = allLocales.filter((l) => l.code !== newFromLocale)
      if (otherLocales.length > 0) {
        setSelectedToLocale(otherLocales[0].code)
      }
    }
  }

  const onToSelectChange = (option: Option<unknown> | Option<unknown>[]) => {
    if (!Array.isArray(option) && option?.value) {
      setSelectedToLocale(option.value as string)
    }
  }

  const onClickTranslate = async () => {
    if (!selectedFromLocale || !selectedToLocale) {
      toast.error(t('plugin-deepltranslate:resolver_deepl_selectBothLanguages' as any))
      return
    }

    setBusy(true)
    setTranslationResult(null)

    try {
      const result = await translateDocument({
        collectionSlug,
        fromLocale: selectedFromLocale as TypedLocale,
        globalSlug,
        id: id || '',
        includeRelationships,
        toLocale: selectedToLocale as TypedLocale,
      })

      setBusy(false)

      if (result.success) {
        setTranslationResult({ success: true })
      } else {
        setTranslationResult({
          error: result.error || t('plugin-deepltranslate:resolver_deepl_errorMessage' as any),
          errorType: result.errorType || 'generic',
          success: false,
        })
      }
    } catch (error) {
      console.error(error)
      setBusy(false)
      setTranslationResult({
        error: t('plugin-deepltranslate:resolver_deepl_errorMessage' as any),
        errorType: 'generic',
        success: false,
      })
    }
  }

  const onViewTranslation = async () => {
    // Change the locale preference and reload
    await setPreference('locale', selectedToLocale)
    window.location.reload()
  }

  return (
    <Modal className="deepltranslate__modal" slug={modalSlug}>
      <div className="deepltranslate__wrapper">
        <button
          aria-label={t('general:close' as any)}
          className="deepltranslate__close"
          onClick={onClose}
          type="button">
          <CloseMenuIcon />
        </button>

        <div className="deepltranslate__content">
          <h2>{t('plugin-deepltranslate:resolver_deepl_modalTitle' as any)}</h2>

          {/* Show translation result if available */}
          {translationResult ? (
            <TranslationResult
              error={translationResult.error}
              errorType={translationResult.errorType}
              onClose={onClose}
              onTryAgain={() => setTranslationResult(null)}
              onViewTranslation={onViewTranslation}
              selectedFromLabel={selectedFromOption?.label}
              selectedToLabel={selectedToOption?.label}
              success={translationResult.success}
            />
          ) : (
            <>
              {/* Show translation form */}
              <LanguageSelectors
                disabled={busy}
                fromSelectOptions={fromSelectOptions}
                onFromSelectChange={onFromSelectChange}
                onToSelectChange={onToSelectChange}
                selectedFromOption={selectedFromOption}
                selectedToOption={selectedToOption}
                toSelectOptions={toSelectOptions}
              />

              <TranslationOptions
                disabled={busy}
                includeRelationships={includeRelationships}
                onIncludeRelationshipsChange={setIncludeRelationships}
              />

              <div className="deepltranslate__buttons">
                <Button
                  disabled={busy || !selectedFromLocale || !selectedToLocale}
                  onClick={onClickTranslate}>
                  {/* Collapsing this ternary would build the key by interpolation; i18n keys
                      must stay static literals so the extractor can find them. */}
                  {/* eslint-disable-next-line unicorn/prefer-minimal-ternary */}
                  {busy
                    ? t('plugin-deepltranslate:resolver_deepl_pleaseWait' as any)
                    : t('plugin-deepltranslate:resolver_deepl_submitButtonLabelFull' as any)}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
