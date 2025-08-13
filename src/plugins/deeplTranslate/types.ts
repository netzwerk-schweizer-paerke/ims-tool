import type { CollectionSlug, GlobalSlug } from 'payload'

export type DeepLTranslateConfig = {
  /**
   * Collections with DeepL Translate enabled
   */
  collections: CollectionSlug[]
  /**
   * Disable the plugin
   */
  disabled?: boolean
  /**
   * Globals with DeepL Translate enabled
   */
  globals: GlobalSlug[]
  /**
   * DeepL API key
   */
  apiKey: string
  /**
   * Track outdated translations (optional)
   */
  trackOutdated?: {
    /**
     * Enable tracking of outdated translations
     */
    enabled: boolean
    /**
     * Field name to store translation metadata
     * @default 'translationMeta'
     */
    fieldName?: string
  }
}
