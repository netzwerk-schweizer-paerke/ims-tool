'use client'
import { useTranslation, XIcon } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

interface DrawerHeaderProps {
  onClose: () => void
  title: string
}

/**
 * Payload's own drawer header, reproduced so the close can run a custom handler.
 *
 * Payload renders that header — title plus the close X in the top right — only when the
 * `Drawer` gets no `Header` prop at all. Passing `Header={null}` suppresses it entirely,
 * which is what used to leave a hand-rolled close button floating in the drawer content
 * instead of sitting in the corner.
 *
 * Drawers whose close is just "shut the drawer" should omit `Header` and pass `title`, and
 * get the native header for free. This exists for the ones whose close does more — the
 * clone and legacy-fetch overlays reset form state and reload the list once something was
 * created, and the native X calls `closeModal(slug)` directly, skipping all of it.
 *
 * The class names are Payload's, so this inherits the same layout and styling.
 */
export const DrawerHeader = ({ onClose, title }: DrawerHeaderProps) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div className="drawer__header">
      <h2 className="drawer__header__title">{title}</h2>
      <button
        aria-label={t('general:close')}
        className="drawer__header__close"
        onClick={onClose}
        type="button">
        <XIcon />
      </button>
    </div>
  )
}
