import type { CollectionSlug, Config, GlobalSlug, Plugin } from 'payload'

import { deepMerge } from 'payload/shared'

import type { DeepLTranslateConfig } from './types'

import { CustomButton } from './client/components/CustomButton'
import { translations } from './i18n-translations'
import { translateEndpoint } from './translate/endpoint'
import { translateOperation } from './translate/operation'

export * from './resolvers/types'

export { translateOperation }

export const deepLTranslate: (pluginConfig: DeepLTranslateConfig) => Plugin = (pluginConfig) => {
  return (config) => {
    if (pluginConfig.disabled || !config.localization || config.localization.locales.length < 2) {
      return config
    }

    const updatedConfig: Config = {
      ...config,
      admin: {
        ...(config.admin ?? {}),
      },
      collections:
        config.collections?.map((collection) => {
          if (!pluginConfig.collections.includes(collection.slug as CollectionSlug)) {
            return collection
          }

          return {
            ...collection,
            admin: {
              ...(collection.admin ?? {}),
              components: {
                ...(collection.admin?.components ?? {}),
                edit: {
                  ...(collection.admin?.components?.edit ?? {}),
                  PublishButton: CustomButton('publish'),
                  SaveButton: CustomButton('save'),
                },
              },
            },
          }
        }) ?? [],
      custom: {
        ...(config.custom ?? {}),
        deepltranslate: pluginConfig,
      },
      endpoints: [
        ...(config.endpoints ?? []),
        {
          handler: translateEndpoint,
          method: 'post',
          path: '/deepltranslate/translate',
        },
      ],
      globals:
        config.globals?.map((global) => {
          if (!pluginConfig.globals.includes(global.slug as GlobalSlug)) {
            return global
          }

          return {
            ...global,
            admin: {
              ...(global.admin ?? {}),
              components: {
                ...(global.admin?.components ?? {}),
                elements: {
                  ...(global.admin?.components?.elements ?? {}),
                  PublishButton: CustomButton('publish'),
                  SaveButton: CustomButton('save'),
                },
              },
            },
          }
        }) ?? [],
      i18n: {
        ...config.i18n,
        translations: {
          ...deepMerge(config.i18n?.translations ?? {}, translations),
        },
      },
    }

    return updatedConfig
  }
}
