'use client'
import { useLocale } from '@payloadcms/ui'
import { ReactNode } from 'react'

import '@/components/graph/graph-hyphenation.css'

type Props = {
  children: ReactNode
}

/**
 * Wraps a read-only block label so a long compound word hyphenates instead of overflowing.
 *
 * This is a client component on purpose. Three call sites are server components, and none of them
 * holds the content locale. See the pitfall page `hyphens-auto-needs-the-lang-attribute`.
 */
export const GraphLabel = ({ children }: Props) => {
  const locale = useLocale()

  return (
    <span className={'graph-hyphenate'} lang={locale?.code}>
      {children}
    </span>
  )
}
