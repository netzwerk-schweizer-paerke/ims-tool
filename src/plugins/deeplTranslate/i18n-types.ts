import { NestedKeysStripped } from '@payloadcms/translations'

import { translations } from './i18n-translations'

/**
 * Every key this plugin adds, in the `namespace:key` form the `t` function takes.
 * The plugin merges its own translations into `config.i18n.translations`, so the
 * key space of a plugin component is wider than `I18nKeys` in `@/lib`.
 */
export type DeepLTranslationKeys = NestedKeysStripped<DeepLTranslationsObject>
export type DeepLTranslationsObject = (typeof translations)['en']
