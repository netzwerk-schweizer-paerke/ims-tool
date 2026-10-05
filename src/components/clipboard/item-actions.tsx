'use client'

import { Popup, PopupList, toast, useLocale, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useClipboard } from '@/components/clipboard/clipboard-provider'
import {
  canPaste,
  type ClipboardItem,
  pasteRequest,
  type PasteTarget,
} from '@/lib/clipboard/paste-request'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Props = {
  /** The item this menu offers to copy. Absent when the user may not copy. */
  copyItem?: ClipboardItem
  /** The edit form of this item. Absent on the public share page. */
  editHref?: string
  /** Where a paste from this menu lands. Absent when the user may not paste. */
  pasteTarget?: PasteTarget
  /** `toolbar` renders a labelled button, `compact` a small trigger for a tile corner. */
  variant?: 'compact' | 'toolbar'
}

const TOOLBAR_TRIGGER = 'btn btn--size-small btn--style-secondary m-0'
const COMPACT_TRIGGER =
  'flex h-6 w-6 items-center justify-center rounded text-base leading-none opacity-60 hover:opacity-100 [background-color:var(--theme-elevation-50)]'

/** The menu that holds edit, copy and paste for one item (PIMS-83). */
export const ItemActions = ({ copyItem, editHref, pasteTarget, variant = 'toolbar' }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { code: locale } = useLocale()
  const router = useRouter()
  const { copy, item } = useClipboard()
  const [busy, setBusy] = useState(false)

  const pasteable = pasteTarget && item && canPaste(item, pasteTarget) ? item : null

  if (!editHref && !copyItem && !pasteable) {
    return null
  }

  const onCopy = async () => {
    if (!copyItem) {
      return
    }

    await copy(copyItem)
    toast.success(t('clipboard:copied', { label: copyItem.label }))
  }

  const onPaste = async () => {
    if (!pasteable || !pasteTarget || busy) {
      return
    }

    const request = pasteRequest(pasteable, pasteTarget, locale)

    if (!request) {
      return
    }

    setBusy(true)

    try {
      const response = await fetch(request.path, {
        body: JSON.stringify(request.body),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const body: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const error =
          typeof body === 'object' && body !== null && 'error' in body
            ? String(body.error)
            : `HTTP ${response.status}`
        toast.error(t('clipboard:pasteFailed', { error }))
        return
      }

      toast.success(t('clipboard:pasted', { label: pasteable.label }))
      router.refresh()
    } catch (error) {
      toast.error(t('clipboard:pasteFailed', { error: String(error) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popup
      button={
        variant === 'toolbar' ? (
          <span className={TOOLBAR_TRIGGER}>
            {/* Collapsing this ternary would build the key by interpolation; i18n keys
                must stay static literals so the extractor can find them. */}
            {/* eslint-disable-next-line unicorn/prefer-minimal-ternary */}
            {busy ? t('clipboard:working') : t('clipboard:actions')}
          </span>
        ) : (
          <span aria-label={t('clipboard:actions')} className={COMPACT_TRIGGER} role={'img'}>
            ⋯
          </span>
        )
      }
      buttonType={'custom'}
      disabled={busy}
      horizontalAlign={'right'}
      render={({ close }) => (
        <PopupList.ButtonGroup>
          {editHref && <PopupList.Button href={editHref}>{t('common:edit')}</PopupList.Button>}
          {copyItem && (
            <PopupList.Button
              onClick={() => {
                close()
                void onCopy()
              }}>
              {t('clipboard:copy')}
            </PopupList.Button>
          )}
          {pasteable && (
            <PopupList.Button
              onClick={() => {
                close()
                void onPaste()
              }}>
              {t('clipboard:pasteHere', { label: pasteable.label })}
            </PopupList.Button>
          )}
        </PopupList.ButtonGroup>
      )}
      size={'medium'}
    />
  )
}
