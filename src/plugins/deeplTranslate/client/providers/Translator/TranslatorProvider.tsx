import {
  toast,
  useAllFormFields,
  useConfig,
  useDocumentInfo,
  useForm,
  useLocale,
  useModal,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { DeepLResolver } from '@/plugins/deeplTranslate'
import { createClient } from '@/plugins/deeplTranslate/client/api'
import { TranslatorContext } from './context'
import { TranslateArgs } from '@/plugins/deeplTranslate/translate/types'

const modalSlug = 'deepltranslate-modal'

export const TranslatorProvider = ({ children }: { children: ReactNode }) => {
  const [data, dispatch] = useAllFormFields()

  const { getFormState } = useServerFunctions()

  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()

  const { setModified } = useForm()

  const modal = useModal()

  const { t } = useTranslation()

  // Since we only use deepl resolver now, we can hardcode the resolver key
  const resolver = 'deepl'

  const resolverT = (
    key:
      | 'buttonLabel'
      | 'errorMessage'
      | 'modalTitle'
      | 'submitButtonLabelEmpty'
      | 'submitButtonLabelFull'
      | 'successMessage',
  ) => {
    return t(`plugin-deepltranslate:resolver_${resolver}_${key}` as Parameters<typeof t>[0])
  }

  const locale = useLocale()

  const {
    config: {
      admin: { custom },
      localization,
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const apiClient = createClient({ api, serverURL })

  // Get the deeplResolver directly
  const resolverConfig = useMemo(() => {
    // Access the deeplResolver directly instead of searching in an array
    return (custom?.deepltranslate?.deeplResolver as DeepLResolver) || null
  }, [custom])

  if (!localization) {
    throw new Error('Localization config is not provided and PluginTranslator is used')
  }

  const localesOptions = localization.locales.filter((each) => each.code !== locale.code)

  const [localeToTranslateFrom, setLocaleToTranslateFrom] = useState<string>('')

  useEffect(() => {
    const defaultFromOptions = localesOptions.find(
      (each) => localization.defaultLocale === each.code,
    )

    if (defaultFromOptions) {
      setLocaleToTranslateFrom(defaultFromOptions.code)
    } else {
      setLocaleToTranslateFrom(localesOptions[0].code)
    }
  }, [locale, localesOptions, localization.defaultLocale])

  const closeTranslator = () => modal.closeModal(modalSlug)

  const submit = async ({ emptyOnly }: { emptyOnly: boolean }) => {
    const args: TranslateArgs = {
      id: id === null ? undefined : id,
      collectionSlug,
      data: reduceFieldsToValues(data, true),
      emptyOnly,
      globalSlug,
      locale: locale.code,
      localeFrom: localeToTranslateFrom,
    }

    const result = await apiClient.translate(args)

    if (!result.success) {
      toast.error(resolverT('errorMessage'))

      return
    }

    const { state } = await getFormState({
      collectionSlug,
      data: result.translatedData,
      docPermissions: {
        fields: true,
        update: true,
      },
      docPreferences: await getDocPreferences(),
      globalSlug,
      locale: locale.code,
      operation: 'update',
      renderAllFields: true,
      schemaPath: collectionSlug || globalSlug || '',
    })

    if (state) {
      dispatch({
        type: 'REPLACE_STATE',
        state,
      })
      setModified(true)
      toast.success(resolverT('successMessage'))
    }
    closeTranslator()
  }

  return (
    <TranslatorContext.Provider
      value={{
        closeTranslator,
        localesOptions,
        localeToTranslateFrom,
        modalSlug,
        openTranslator: () => {
          modal.openModal(modalSlug)
        },
        resolver: resolverConfig,
        resolverT,
        setLocaleToTranslateFrom,
        submit,
      }}>
      {children}
    </TranslatorContext.Provider>
  )
}
