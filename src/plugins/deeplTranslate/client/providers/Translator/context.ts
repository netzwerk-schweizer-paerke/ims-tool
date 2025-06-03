import type { Locale } from 'payload'

import { createContext, useContext } from 'react'
import { DeepLResolver } from '@/plugins/deeplTranslate'

type TranslatorContextData = {
  closeTranslator: () => void
  localesOptions: Locale[]
  localeToTranslateFrom: string
  modalSlug: string
  openTranslator: () => void
  resolver: null | DeepLResolver
  resolverT: (
    key:
      | 'buttonLabel'
      | 'errorMessage'
      | 'modalTitle'
      | 'submitButtonLabelEmpty'
      | 'submitButtonLabelFull'
      | 'successMessage'
      | 'pleaseWait',
  ) => string
  setLocaleToTranslateFrom: (code: string) => void
  submit: (args: { emptyOnly: boolean }) => Promise<void>
}

export const TranslatorContext = createContext<null | TranslatorContextData>(null)

export const useTranslator = () => {
  const context = useContext(TranslatorContext)

  if (context === null) {
    throw new Error('useTranslator must be used within TranslatorProvider')
  }

  return context
}
