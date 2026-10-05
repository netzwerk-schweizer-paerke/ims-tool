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
}

/** A round trigger with three vertical dots. The parent places it in a top right corner. */
const TRIGGER =
  'flex size-7 items-center justify-center rounded-full border border-solid transition-colors [border-color:var(--theme-elevation-150)] [background-color:var(--theme-elevation-0)] [color:var(--theme-elevation-800)] hover:[background-color:var(--theme-elevation-100)]'

const VerticalDots = () => (
  <svg aria-hidden={true} fill={'currentColor'} height={14} viewBox={'0 0 4 16'} width={4}>
    <circle cx={2} cy={2} r={1.6} />
    <circle cx={2} cy={8} r={1.6} />
    <circle cx={2} cy={14} r={1.6} />
  </svg>
)

/** The menu that holds edit, copy and paste for one item (PIMS-83). */
export const ItemActions = ({ copyItem, editHref, pasteTarget }: Props) => {
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
        <span
          aria-busy={busy}
          aria-label={t('clipboard:actions')}
          className={`${TRIGGER} ${busy ? 'animate-pulse' : ''}`}
          role={'img'}
          title={t('clipboard:actions')}>
          <VerticalDots />
        </span>
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
