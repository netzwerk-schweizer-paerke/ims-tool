'use client'

import { usePreferences } from '@payloadcms/ui'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { PasteDialog } from '@/components/clipboard/paste-dialog'
import { usePasteRun } from '@/components/clipboard/use-paste-run'
import { type ClipboardItem, parseClipboardItem, type PasteTarget } from '@/lib/clipboard/paste-request'

/** The Payload preference key. A preference survives a reload and a park switch (PIMS-83). */
const PREFERENCE_KEY = 'ims-clipboard'

type ClipboardState = {
  clear: () => Promise<void>
  copy: (item: ClipboardItem) => Promise<void>
  item: ClipboardItem | null
  paste: (item: ClipboardItem, target: PasteTarget, locale: string) => Promise<void>
  /** True while a paste runs or its result is open. Every menu then stays locked. */
  pasting: boolean
}

const ClipboardContext = createContext<ClipboardState | null>(null)

type Props = {
  children?: ReactNode
}

/** Mounted through `admin.components.providers`, so every admin view shares one clipboard. */
export const ClipboardProvider = ({ children }: Props) => {
  const { getPreference, setPreference } = usePreferences()
  const [item, setItem] = useState<ClipboardItem | null>(null)

  useEffect(() => {
    let cancelled = false

    getPreference<unknown>(PREFERENCE_KEY)
      .then((stored) => {
        if (!cancelled) {
          setItem(parseClipboardItem(stored))
        }
      })
      .catch(() => {
        // A page without a session has no preferences. The clipboard then stays empty.
      })

    return () => {
      cancelled = true
    }
  }, [getPreference])

  const copy = useCallback(
    async (next: ClipboardItem) => {
      setItem(next)
      await setPreference(PREFERENCE_KEY, next)
    },
    [setPreference],
  )

  const clear = useCallback(async () => {
    setItem(null)
    await setPreference(PREFERENCE_KEY, null)
  }, [setPreference])

  const { dismiss, paste, run } = usePasteRun()
  const pasting = run.status !== 'idle'

  const value = useMemo(
    () => ({ clear, copy, item, paste, pasting }),
    [clear, copy, item, paste, pasting],
  )

  return (
    <ClipboardContext.Provider value={value}>
      {children}
      <PasteDialog onClose={dismiss} run={run} />
    </ClipboardContext.Provider>
  )
}

const noop = async () => {}

/** Outside the provider, such as on the public share page, the clipboard reads as empty. */
export const useClipboard = (): ClipboardState =>
  useContext(ClipboardContext) ?? { clear: noop, copy: noop, item: null, paste: noop, pasting: false }
