import { Button, useTranslation } from '@payloadcms/ui'
import { useTranslator } from '@/plugins/deeplTranslate/client/providers/Translator/context'

export const ResolverButton = () => {
  const { openTranslator } = useTranslator()

  const { t } = useTranslation()

  // No need to pass resolverKey since we've hardcoded it to 'deepl'
  const handleClick = () => openTranslator()

  return (
    <Button onClick={handleClick}>
      {t('plugin-deepltranslate:resolver_deepl_buttonLabel' as Parameters<typeof t>[0])}
    </Button>
  )
}
