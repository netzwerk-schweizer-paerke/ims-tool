import { ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import React, { CSSProperties } from 'react'

import '@/lib/lexical-render/src/rich-text-link.css'

type Props = {
  children?: React.ReactNode
  href: string
  newTab?: boolean
  style?: CSSProperties
  title?: string
  variant: 'document' | 'external'
}

const ICONS = {
  document: FileText,
  external: ExternalLink,
} as const

/**
 * A link inside a rich-text field, marked by what it points at.
 *
 * The variant comes from the stored relation, never from the link label. The same document
 * appears on one page with a file-name label and with a readable label, so the text decides
 * nothing. The icon is decorative and carries `aria-hidden`.
 */
export const RichTextLink = ({ children, href, newTab, style, title, variant }: Props) => {
  const Icon = ICONS[variant]

  return (
    <Link
      className={'rich-text-link'}
      href={href}
      style={style}
      target={newTab ? '_blank' : '_self'}
      title={title}>
      <Icon aria-hidden={true} className={'rich-text-link__icon'} />
      <span>{children}</span>
    </Link>
  )
}
