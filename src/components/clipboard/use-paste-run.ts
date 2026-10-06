'use client'

import { toast, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { findNewPasteKey, type PasteOutcome, pasteOutcome } from '@/lib/clipboard/paste-outcome'
import { type ClipboardItem, pasteRequest, type PasteTarget } from '@/lib/clipboard/paste-request'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

export type PasteRun =
  | { label: string; outcome: Exclude<PasteOutcome, { kind: 'success' }>; status: 'result' }
  | { label: string; status: 'running' }
  | { status: 'idle' }

/** The highlight lasts as long as the one of the health report. */
const HIGHLIGHT_MS = 3000

/** The refreshed page can render a moment after the transition ends. Retry for 2 seconds. */
const HIGHLIGHT_ATTEMPTS = 20
const HIGHLIGHT_RETRY_MS = 100

const readPasteKeys = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-paste-key]'),
    (element) => element.dataset.pasteKey,
  ).filter((key): key is string => key !== undefined)

const highlight = (key: string) => {
  const element = document.querySelector<HTMLElement>(`[data-paste-key="${CSS.escape(key)}"]`)

  if (!element) {
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.style.outline = '3px solid var(--theme-success-500)'
  element.style.outlineOffset = '4px'
  setTimeout(() => {
    element.style.outline = ''
    element.style.outlineOffset = ''
  }, HIGHLIGHT_MS)
}

/**
 * Runs one paste at a time for the whole admin (PIMS-83). It warns before the page closes during
 * a paste, refreshes the view after it, and highlights the item the paste added.
 */
export const usePasteRun = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const router = useRouter()
  const [run, setRun] = useState<PasteRun>({ status: 'idle' })
  const [refreshing, startRefresh] = useTransition()
  const keysBefore = useRef<null | Set<string>>(null)
  const active = useRef(false)

  useEffect(() => {
    if (run.status !== 'running') {
      return
    }

    // The server finishes the paste anyway, but the user would never see the result.
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()

    window.addEventListener('beforeunload', warn)

    return () => window.removeEventListener('beforeunload', warn)
  }, [run.status])

  // Wait until the refreshed view renders and no dialog covers it.
  useEffect(() => {
    const before = keysBefore.current

    if (refreshing || run.status !== 'idle' || !before) {
      return
    }

    keysBefore.current = null
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const tryHighlight = () => {
      const key = findNewPasteKey(before, readPasteKeys())

      if (key) {
        highlight(key)
      } else if (++attempts < HIGHLIGHT_ATTEMPTS) {
        timer = setTimeout(tryHighlight, HIGHLIGHT_RETRY_MS)
      }
    }

    tryHighlight()

    return () => clearTimeout(timer)
  }, [refreshing, run.status])

  const paste = useCallback(
    async (item: ClipboardItem, target: PasteTarget, locale: string) => {
      const request = pasteRequest(item, target, locale)

      if (!request || active.current) {
        return
      }

      active.current = true
      keysBefore.current = new Set(readPasteKeys())
      setRun({ label: item.label, status: 'running' })

      try {
        const response = await fetch(request.path, {
          body: JSON.stringify(request.body),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const body: unknown = await response.json().catch(() => null)
        const outcome = pasteOutcome(response.ok, response.status, body)

        if (outcome.kind === 'failed') {
          keysBefore.current = null
          setRun({ label: item.label, outcome, status: 'result' })
          return
        }

        if (outcome.kind === 'success') {
          toast.success(t('clipboard:pasted', { label: item.label }))
          setRun({ status: 'idle' })
        } else {
          setRun({ label: item.label, outcome, status: 'result' })
        }

        startRefresh(() => router.refresh())
      } catch (error) {
        keysBefore.current = null
        setRun({
          label: item.label,
          outcome: { details: [], error: String(error), kind: 'failed' },
          status: 'result',
        })
      } finally {
        active.current = false
      }
    },
    [router, t],
  )

  const dismiss = useCallback(() => setRun({ status: 'idle' }), [])

  return { dismiss, paste, run }
}
