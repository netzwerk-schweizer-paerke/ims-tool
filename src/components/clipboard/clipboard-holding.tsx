'use client'

import { useTranslation } from '@payloadcms/ui'

import { useClipboard } from '@/components/clipboard/clipboard-provider'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

/** Names the copied item next to the toolbar menu, so a paste never inserts a surprise. */
export const ClipboardHolding = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { clear, item } = useClipboard()

  if (!item) {
    return null
  }

  return (
    <span className={'flex items-center gap-2 text-xs [color:var(--theme-elevation-600)]'}>
      <span className={'max-w-56 truncate'} title={item.label}>
        {t('clipboard:holding', { label: item.label })}
      </span>
      <button
        className={'cursor-pointer border-0 bg-transparent p-0 text-xs underline underline-offset-2'}
        onClick={() => void clear()}
        type={'button'}>
        {t('clipboard:clear')}
      </button>
    </span>
  )
}
