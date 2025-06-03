import { Button, useTranslation } from '@payloadcms/ui'
import { useTranslator } from '@/plugins/deeplTranslate/client/providers/Translator/context'
import React, { useCallback } from 'react'

/**
 * A button component that opens the translator modal
 */
export const ResolverButton: React.FC = () => {
  const { openTranslator } = useTranslator()
  const { t } = useTranslation()

  const handleClick = useCallback(() => {
    openTranslator()
  }, [openTranslator])

  const buttonLabel = t(
    'plugin-deepltranslate:resolver_deepl_buttonLabel' as Parameters<typeof t>[0],
  )

  return <Button onClick={handleClick}>{buttonLabel}</Button>
}
