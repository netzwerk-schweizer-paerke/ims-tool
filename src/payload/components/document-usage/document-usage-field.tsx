'use client'
import { FieldLabel, useField, useTranslation } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import React from 'react'

import { DocumentUsage, DocumentUsageReference } from '@/lib/document-usage'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Translator = (key: I18nKeys, vars?: Record<string, unknown>) => string

/**
 * The three groups `addUsageInfoAfterReadHook` fills, paired with the collection each one
 * links to. The order is the order the sidebar renders them in.
 */
const GROUPS = [
  { collection: 'activities', key: 'activities', titleKey: 'documentUsage:activities' },
  { collection: 'task-flows', key: 'taskFlows', titleKey: 'documentUsage:taskFlows' },
  { collection: 'task-lists', key: 'taskLists', titleKey: 'documentUsage:taskLists' },
] as const

/**
 * Replaces the raw JSON editor on the virtual `usedIn` field with a total and a list of
 * links. Every entry opens in a new tab, because the reference lives in another document
 * and a same-tab navigation would drop unsaved edits on this one.
 *
 * A bare count follows the list when the caller's read access hid rows, which is the case for
 * every shared document. It says that other parks use the document, and nothing more.
 */
export const DocumentUsageField: JSONFieldClientComponent = ({ path }) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  // The create view has no document, and the hook's catch path returns one without the key.
  const { value } = useField<DocumentUsage | undefined>({ path })

  const groups = GROUPS.map((group) => ({
    ...group,
    entries: value?.[group.key] ?? [],
  })).filter((group) => group.entries.length > 0)

  const total = groups.reduce((sum, group) => sum + group.entries.length, 0)
  const hidden = value?.hiddenReferenceCount

  return (
    <div className="field-type">
      <FieldLabel label={t('documentUsage:title')} path={path} />

      {total === 0 ? (
        <p className="m-0 text-sm text-[var(--theme-elevation-500)]">
          {t('documentUsage:empty')}
        </p>
      ) : (
        <>
          <p className="m-0 mb-3 text-sm text-[var(--theme-elevation-500)]">
            {t('documentUsage:total', { count: total })}
          </p>

          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <section key={group.key}>
                <h4 className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--theme-elevation-500)]">
                  {t(group.titleKey)} ({group.entries.length})
                </h4>

                <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                  {group.entries.map((entry, index) => {
                    const reference = referenceLabel(t, entry)

                    return (
                      <li key={`${group.key}-${entry.id}-${index}`}>
                        <a
                          className="break-words underline underline-offset-2"
                          href={`/admin/collections/${group.collection}/${entry.id}`}
                          rel="noopener noreferrer"
                          target="_blank">
                          {entry.name}
                        </a>
                        {reference && (
                          <div className="text-xs text-[var(--theme-elevation-450)]">
                            {reference}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {typeof hidden === 'number' && hidden > 0 && (
        <p className="m-0 mt-3 text-sm text-[var(--theme-elevation-500)]">
          {t('documentUsage:hiddenReferences', { count: hidden })}
        </p>
      )}
    </div>
  )
}

/** Known reference fields get a translated label. Anything else shows its raw name. */
const fieldLabel = (t: Translator, field: string | undefined): string | undefined => {
  switch (field) {
    case 'blocks': {
      return t('documentUsage:field:blocks')
    }
    case 'description': {
      return t('documentUsage:field:description')
    }
    case 'files': {
      return t('documentUsage:field:files')
    }
    case 'infos': {
      return t('documentUsage:field:infos')
    }
    case 'io': {
      return t('documentUsage:field:io')
    }
    case 'items': {
      return t('documentUsage:field:items')
    }
    case 'relations.tasks': {
      return t('documentUsage:field:relationsTasks')
    }
    default: {
      return field
    }
  }
}

/** The second line under a link: which field holds the reference, and in which locale. */
const referenceLabel = (t: Translator, entry: DocumentUsageReference): null | string => {
  const parts: string[] = []
  const field = fieldLabel(t, entry.field)

  if (field) {
    parts.push(field)
  }

  if (entry.locale) {
    parts.push(entry.locale.toUpperCase())
  }

  return parts.length > 0 ? parts.join(' · ') : null
}
