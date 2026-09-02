'use client'

import { useConfig, useFormFields, useLocale, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'

import type { TranslationMeta } from '../../../fields/translation-meta-field'

interface Props {
  metaFieldName?: string
}

export const TranslationIndicator = ({ metaFieldName = 'translationMeta' }: Props) => {
  const locale = useLocale()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const fields = useFormFields(([fields]) => fields)
  const [showTooltip, setShowTooltip] = React.useState(false)

  const dateFormat = config.admin.dateFormat

  // TranslationProvider loads i18n.dateFNS in an effect, so it is undefined on the first render.
  // Payload's own formatTimeToNow omits addSuffix, which makes German read "vor 4 Monate".
  const relativeTime = (date: string) =>
    i18n.dateFNS
      ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: i18n.dateFNS })
      : `${t('general:loading')}...`

  // Get the translation metadata from form fields
  const metaField = fields[metaFieldName]
  const translationMeta = metaField?.value as TranslationMeta | undefined

  // Check if current locale has outdated translation
  const currentTranslation = translationMeta?.translations?.[locale.code]
  const isOutdated = currentTranslation?.isOutdated === true
  const sourceLocale = currentTranslation?.from
  const sourceLastModified = sourceLocale
    ? translationMeta?.lastModified?.[sourceLocale]
    : undefined

  // Check if current locale is a source for any outdated translations
  const outdatedDependents = React.useMemo(() => {
    if (!translationMeta?.translations) return []

    return Object.entries(translationMeta.translations)
      .filter(([targetLocale, info]) => info.from === locale.code && info.isOutdated === true)
      .map(([targetLocale]) => targetLocale)
  }, [translationMeta, locale.code])

  const hasOutdatedDependents = outdatedDependents.length > 0

  // Show indicator if either:
  // 1. This locale is outdated (translated from another locale)
  // 2. This locale has outdated dependent translations
  if (!isOutdated && !hasOutdatedDependents) {
    return null
  }

  const tooltipContent = isOutdated ? (
    <>
      <strong className="mb-[var(--spacing-field)] block text-[var(--theme-warning-500)]">
        {t('plugin-deepltranslate:translation_outdated_title' as any)}
      </strong>
      <p className="mb-[var(--spacing-field)] text-[var(--theme-elevation-200)]">
        {t('plugin-deepltranslate:translation_outdated_description' as any).replaceAll(
          '{{source}}',
          sourceLocale?.toUpperCase() || '',
        )}
      </p>
      {currentTranslation?.date && (
        <div className="mt-2 border-t border-[var(--theme-elevation-900)] pt-2">
          <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)]">
            {t('plugin-deepltranslate:translation_outdated_lastTranslated' as any)}:{' '}
            <strong>{relativeTime(currentTranslation.date)}</strong>
          </p>
          <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)] opacity-60">
            {formatDate({ date: currentTranslation.date, i18n, pattern: dateFormat })}
          </p>
          {sourceLastModified && (
            <>
              <p className="mt-2 text-[var(--font-size-small)] text-[var(--theme-elevation-400)]">
                {t('plugin-deepltranslate:translation_outdated_source_modified' as any).replaceAll(
                  '{{source}}',
                  sourceLocale?.toUpperCase() || '',
                )}
                :{' '}
                <strong>{relativeTime(sourceLastModified)}</strong>
              </p>
              <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)] opacity-60">
                {formatDate({ date: sourceLastModified, i18n, pattern: dateFormat })}
              </p>
            </>
          )}
        </div>
      )}
    </>
  ) : (
    <>
      <strong className="mb-[var(--spacing-field)] block text-[var(--theme-warning-500)]">
        {t('plugin-deepltranslate:translation_dependents_outdated_title' as any)}
      </strong>
      <p className="mb-[var(--spacing-field)] text-[var(--theme-elevation-200)]">
        {t('plugin-deepltranslate:translation_dependents_outdated_description' as any)}
      </p>
      <ul className="list-inside list-disc text-[var(--theme-elevation-200)]">
        {outdatedDependents.map((dep) => (
          <li key={dep}>{dep.toUpperCase()}</li>
        ))}
      </ul>
    </>
  )

  return (
    <div
      className="relative ml-2 inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}>
      <span className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-[var(--theme-warning-200)] bg-[var(--theme-warning-50)] text-[var(--theme-warning-600)]">
        ⚠️
      </span>

      {showTooltip && (
        <div className="absolute left-1/2 top-full z-[9999] mt-2 min-w-[200px] max-w-xs -translate-x-1/2 rounded-[var(--border-radius-s)] border border-[var(--theme-elevation-900)] bg-[var(--theme-elevation-1000)] p-3 leading-[var(--line-height-m)] text-[var(--font-size-small)] text-[var(--theme-elevation-0)] shadow-[var(--box-shadow-m)]">
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-b-[6px] border-l-[6px] border-r-[6px] border-b-[var(--theme-elevation-1000)] border-l-transparent border-r-transparent" />

          {tooltipContent}
        </div>
      )}
    </div>
  )
}
