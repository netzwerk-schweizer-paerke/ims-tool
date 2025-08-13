'use client'

import React from 'react'
import { useFormFields, useLocale, useTranslation } from '@payloadcms/ui'
import type { TranslationMeta } from '../../../fields/translation-meta-field'

interface Props {
  metaFieldName?: string
}

const getRelativeTime = (date: string): string => {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return past.toLocaleDateString()
}

export const TranslationIndicator: React.FC<Props> = ({ metaFieldName = 'translationMeta' }) => {
  const locale = useLocale()
  const { t } = useTranslation()
  const fields = useFormFields(([fields]) => fields)
  const [showTooltip, setShowTooltip] = React.useState(false)

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
        {t('plugin-deepltranslate:translation_outdated_description' as any).replace(
          /\{\{source\}\}/g,
          sourceLocale?.toUpperCase() || '',
        )}
      </p>
      {currentTranslation?.date && (
        <div className="mt-2 border-t border-[var(--theme-elevation-900)] pt-2">
          <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)]">
            {t('plugin-deepltranslate:translation_outdated_lastTranslated' as any)}:{' '}
            <strong>{getRelativeTime(currentTranslation.date)}</strong>
          </p>
          <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)] opacity-60">
            {new Date(currentTranslation.date).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          {sourceLastModified && (
            <>
              <p className="mt-2 text-[var(--font-size-small)] text-[var(--theme-elevation-400)]">
                {sourceLocale?.toUpperCase()} modified:{' '}
                <strong>{getRelativeTime(sourceLastModified)}</strong>
              </p>
              <p className="text-[var(--font-size-small)] text-[var(--theme-elevation-400)] opacity-60">
                {new Date(sourceLastModified).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
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
