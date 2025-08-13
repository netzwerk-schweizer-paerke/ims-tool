import type { CollectionSlug, Config, GlobalSlug, Plugin } from 'payload'

import { deepMerge } from 'payload/shared'

import type { DeepLTranslateConfig } from './types'

import { CustomButton } from './client/components/buttons/custom-button'
import { translations } from './i18n-translations'
import { translateEndpoint } from './server/endpoints/translate'
import { translateOperation } from './server/operations/translate-operation'
import { translationMetaField } from './fields/translation-meta-field'
import {
  createTrackTranslationChangesHookForCollection,
  createTrackTranslationChangesHookForGlobal,
  createClearOutdatedHookForCollection,
  createClearOutdatedHookForGlobal,
} from './hooks/track-translation-changes'

export * from './server/services/resolver-types'

export { translateOperation }

export const deepLTranslate: (pluginConfig: DeepLTranslateConfig) => Plugin = (pluginConfig) => {
  return (config) => {
    if (pluginConfig.disabled || !config.localization || config.localization.locales.length < 2) {
      return config
    }

    // Setup tracking configuration
    const trackingEnabled = pluginConfig.trackOutdated?.enabled ?? false
    const metaFieldName = pluginConfig.trackOutdated?.fieldName ?? 'translationMeta'

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

          const collectionWithTranslation = {
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

          // Add tracking field and hooks if enabled
          if (trackingEnabled) {
            // Add the metadata field
            collectionWithTranslation.fields = [
              ...collection.fields,
              translationMetaField(metaFieldName),
            ]

            // Add hooks
            collectionWithTranslation.hooks = {
              ...collection.hooks,
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                createTrackTranslationChangesHookForCollection(metaFieldName),
                createClearOutdatedHookForCollection(metaFieldName),
              ],
            }
          }

          return collectionWithTranslation
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

          const globalWithTranslation = {
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

          // Add tracking field and hooks if enabled
          if (trackingEnabled) {
            // Add the metadata field
            globalWithTranslation.fields = [...global.fields, translationMetaField(metaFieldName)]

            // Add hooks
            globalWithTranslation.hooks = {
              ...global.hooks,
              beforeChange: [
                ...(global.hooks?.beforeChange || []),
                createTrackTranslationChangesHookForGlobal(metaFieldName),
                createClearOutdatedHookForGlobal(metaFieldName),
              ],
            }
          }

          return globalWithTranslation
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
