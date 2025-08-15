import React from 'react'
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
import { getTranslation } from '@payloadcms/translations'
import { TypedLocale } from 'payload'
import { translateDocument } from '../../api/translate-api'
import { hasLocalization } from '@/lib/locale-utils'
import { TranslationResult } from './TranslationResult'
import { LanguageSelectors } from './LanguageSelectors'
import { TranslationOptions } from './TranslationOptions'

import './styles.scss'

interface Props {
  modalSlug: string
  onClose: () => void
}

// Type for React Select option
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

export const StandaloneTranslatorModal: React.FC<Props> = ({ modalSlug, onClose }) => {
  const [busy, setBusy] = React.useState(false)
  const [selectedFromLocale, setSelectedFromLocale] = React.useState<string>('')
  const [selectedToLocale, setSelectedToLocale] = React.useState<string>('')
  const [includeRelationships, setIncludeRelationships] = React.useState(false)
  const [translationResult, setTranslationResult] = React.useState<{
    success: boolean
    error?: string
    errorType?: 'quota_exceeded' | 'generic' | 'network' | 'authentication'
  } | null>(null)

  const { id, collectionSlug, globalSlug } = useDocumentInfo()
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
    if (hasLocalization(config) && allLocales.length > 0) {
      setSelectedFromLocale(locale.code)
      const otherLocales = allLocales.filter((l) => l.code !== locale.code)
      if (otherLocales.length > 0) {
        setSelectedToLocale(otherLocales[0].code)
      }
    }
  }, [config, allLocales, locale.code])

  // Options for the FROM select (all locales)
  const fromSelectOptions = React.useMemo(
    () =>
      allLocales.map((option) => {
        const label = getTranslation(option.label, i18n)
        return {
          value: option.code,
          label: label !== option.code ? `${label} (${option.code})` : label,
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
            value: option.code,
            label: label !== option.code ? `${label} (${option.code})` : label,
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
    if (!Array.isArray(option) && option?.value) {
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
        id: id || '',
        collectionSlug,
        globalSlug,
        fromLocale: selectedFromLocale as TypedLocale,
        toLocale: selectedToLocale as TypedLocale,
        includeRelationships,
      })

      setBusy(false)

      if (result.success) {
        setTranslationResult({ success: true })
      } else {
        setTranslationResult({
          success: false,
          error: result.error || t('plugin-deepltranslate:resolver_deepl_errorMessage' as any),
          errorType: result.errorType || 'generic',
        })
      }
    } catch (error) {
      console.error(error)
      setBusy(false)
      setTranslationResult({
        success: false,
        error: t('plugin-deepltranslate:resolver_deepl_errorMessage' as any),
        errorType: 'generic',
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
          type="button"
          aria-label="Close"
          className="deepltranslate__close"
          onClick={onClose}>
          <CloseMenuIcon />
        </button>

        <div className="deepltranslate__content">
          <h2>{t('plugin-deepltranslate:resolver_deepl_modalTitle' as any)}</h2>

          {/* Show translation result if available */}
          {translationResult ? (
            <TranslationResult
              success={translationResult.success}
              error={translationResult.error}
              errorType={translationResult.errorType}
              selectedFromLabel={selectedFromOption?.label}
              selectedToLabel={selectedToOption?.label}
              onViewTranslation={onViewTranslation}
              onClose={onClose}
              onTryAgain={() => setTranslationResult(null)}
            />
          ) : (
            <>
              {/* Show translation form */}
              <LanguageSelectors
                fromSelectOptions={fromSelectOptions}
                toSelectOptions={toSelectOptions}
                selectedFromOption={selectedFromOption}
                selectedToOption={selectedToOption}
                onFromSelectChange={onFromSelectChange}
                onToSelectChange={onToSelectChange}
                disabled={busy}
              />

              <TranslationOptions
                includeRelationships={includeRelationships}
                onIncludeRelationshipsChange={setIncludeRelationships}
                disabled={busy}
              />

              <div className="deepltranslate__buttons">
                <Button
                  onClick={onClickTranslate}
                  disabled={busy || !selectedFromLocale || !selectedToLocale}>
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
