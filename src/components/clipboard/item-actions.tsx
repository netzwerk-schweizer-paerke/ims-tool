'use client'

import { Popup, PopupList, toast, useLocale, useTranslation } from '@payloadcms/ui'

import { useClipboard } from '@/components/clipboard/clipboard-provider'
import {
  canPaste,
  type ClipboardItem,
  type PasteTarget,
  placeTarget,
} from '@/lib/clipboard/paste-request'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Props = {
  /** The item this menu offers to copy. Absent when the user may not copy. */
  copyItem?: ClipboardItem
  /** The edit form of this item. Absent on the public share page. */
  editHref?: string
  /** Where a paste into this item lands, one level down. Absent when the user may not paste. */
  pasteTarget?: PasteTarget
  /**
   * The level this item belongs to, anchored on this item. It offers "Davor" and "Danach" when
   * the clipboard holds an item of the same kind. Absent when the user may not paste.
   */
  siblingTarget?: PasteTarget
}

/** A round trigger with three vertical dots. The parent places it. */
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
export const ItemActions = ({ copyItem, editHref, pasteTarget, siblingTarget }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { code: locale } = useLocale()
  const { copy, item, paste, pasting: busy } = useClipboard()

  const pasteable = pasteTarget && item && canPaste(item, pasteTarget) ? item : null
  const sibling = siblingTarget && item && canPaste(item, siblingTarget) ? item : null

  if (!editHref && !copyItem && !pasteable && !sibling) {
    return null
  }

  const onCopy = async () => {
    if (!copyItem) {
      return
    }

    await copy(copyItem)
    toast.success(t('clipboard:copied', { label: copyItem.label }))
  }

  const onPaste = (clipboardItem: ClipboardItem, target: PasteTarget) =>
    paste(clipboardItem, target, locale)

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
          {sibling && siblingTarget && (
            <>
              <PopupList.Button
                onClick={() => {
                  close()
                  void onPaste(sibling, placeTarget(siblingTarget, 'before'))
                }}>
                {t('clipboard:pasteBefore', { label: sibling.label })}
              </PopupList.Button>
              <PopupList.Button
                onClick={() => {
                  close()
                  void onPaste(sibling, placeTarget(siblingTarget, 'after'))
                }}>
                {t('clipboard:pasteAfter', { label: sibling.label })}
              </PopupList.Button>
            </>
          )}
          {pasteable && pasteTarget && (
            <PopupList.Button
              onClick={() => {
                close()
                void onPaste(pasteable, pasteTarget)
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
