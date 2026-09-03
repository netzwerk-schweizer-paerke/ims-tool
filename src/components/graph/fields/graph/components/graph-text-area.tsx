'use client'
import { useLocale } from '@payloadcms/ui'

import '@/components/graph/fields/graph/components/graph-text-area.css'
import '@/components/graph/graph-hyphenation.css'

type Props = {
  className?: string
  onTextChange: (text: string) => void
  value: string
}

// The `graph-text-area` class carries the vertical centring. Flex on the textarea itself does
// nothing, because a textarea has no CSS children.
export const GraphTextArea = ({ className = '', onTextChange, value }: Props) => {
  const locale = useLocale()

  return (
    <textarea
      className={`graph-text-area graph-hyphenate resize-none rounded-2xl text-center leading-snug focus:outline-none ${className}`}
      // Hyphenation picks its dictionary from this attribute. Without it the element inherits the
      // admin language from `<html lang>`, which is a different axis from the content locale.
      // Payload's own types warn that the hook can return an object with no `code`.
      lang={locale?.code}
      onChange={(event) => onTextChange(event.target.value)}
      value={value}
    />
  )
}
