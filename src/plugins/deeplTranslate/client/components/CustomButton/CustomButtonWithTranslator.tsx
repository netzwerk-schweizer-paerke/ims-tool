'use client'

import './styles.scss'

import { PublishButton, SaveButton, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { TranslatorProvider } from '@/plugins/deeplTranslate/client/providers/Translator/TranslatorProvider'
import { TranslatorModal } from '@/plugins/deeplTranslate/client/components/TranslatorModal'
import { ResolverButton } from '@/plugins/deeplTranslate/client/components/ResolverButton'

export const CustomButtonWithTranslator = ({ type }: { type: 'publish' | 'save' }) => {
  const { config } = useConfig()

  const DefaultButton = type === 'publish' ? PublishButton : SaveButton

  const { id, globalSlug } = useDocumentInfo()

  if (!id && !globalSlug) {
    return <DefaultButton />
  }

  return (
    <TranslatorProvider>
      <div className={'deepltranslate__custom-save-button'}>
        <TranslatorModal />
        <ResolverButton />
        <DefaultButton />
      </div>
    </TranslatorProvider>
  )
}
