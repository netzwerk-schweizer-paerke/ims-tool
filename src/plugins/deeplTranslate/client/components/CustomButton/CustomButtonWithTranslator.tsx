'use client'

import './styles.scss'

import { PublishButton, SaveButton, useDocumentInfo } from '@payloadcms/ui'
import { TranslatorProvider } from '@/plugins/deeplTranslate/client/providers/Translator/TranslatorProvider'
import { TranslatorModal } from '@/plugins/deeplTranslate/client/components/TranslatorModal'
import { ResolverButton } from '@/plugins/deeplTranslate/client/components/ResolverButton'
import React, { useMemo } from 'react'

interface CustomButtonWithTranslatorProps {
  type: 'publish' | 'save'
}

/**
 * Custom button component that integrates with the Translator functionality
 * Wraps either the PublishButton or SaveButton based on the type prop
 */
export const CustomButtonWithTranslator: React.FC<CustomButtonWithTranslatorProps> = ({ type }) => {
  const { id, globalSlug } = useDocumentInfo()

  // Determine which button component to use based on type
  const DefaultButton = useMemo(() => (type === 'publish' ? PublishButton : SaveButton), [type])

  // If no document ID or global slug is available, render the default button without translator
  if (!id && !globalSlug) {
    return <DefaultButton />
  }

  return (
    <TranslatorProvider>
      <div className="deepltranslate__custom-save-button">
        <TranslatorModal />
        <ResolverButton />
        <DefaultButton />
      </div>
    </TranslatorProvider>
  )
}
