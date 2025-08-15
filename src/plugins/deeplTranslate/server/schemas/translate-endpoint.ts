import { z } from 'zod'
import type { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

/**
 * Supported locales in the system
 * Based on Payload config: de, fr, it, en
 */
const SUPPORTED_LOCALES = ['de', 'fr', 'it'] as const

/**
 * DoS protection limits
 */
const DOS_PROTECTION = {
  MAX_IDS: 100,
  MAX_DEPTH: 5,
} as const

/**
 * Zod schema for the translate endpoint request
 * Provides comprehensive validation with DoS protection and clear error messages
 */
export const translateEndpointSchema = z
  .object({
    /**
     * Document ID - required, must be string or number
     */
    id: z
      .union([z.string().min(1, 'ID cannot be empty'), z.number().positive('ID must be positive')])
      .describe('The ID of the document to translate'),

    /**
     * Collection slug - optional but either this or globalSlug must be provided
     */
    collectionSlug: z
      .string()
      .min(1, 'Collection slug cannot be empty')
      .optional()
      .describe('The collection slug where the document exists'),

    /**
     * Global slug - optional but either this or collectionSlug must be provided
     */
    globalSlug: z
      .string()
      .min(1, 'Global slug cannot be empty')
      .optional()
      .describe('The global slug where the document exists'),

    /**
     * Source locale - required, must be one of supported locales
     */
    fromLocale: z.enum(SUPPORTED_LOCALES)
      .describe('The source locale to translate from'),

    /**
     * Target locale - required, must be one of supported locales
     */
    toLocale: z.enum(SUPPORTED_LOCALES)
      .describe('The target locale to translate to'),

    /**
     * Include relationships flag - optional, defaults to false
     */
    includeRelationships: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to include related documents in translation'),

    /**
     * Relationship depth - optional, defaults to 1, max 5 for DoS protection
     */
    relationshipDepth: z
      .number()
      .int('Relationship depth must be an integer')
      .min(0, 'Relationship depth cannot be negative')
      .max(DOS_PROTECTION.MAX_DEPTH, `Relationship depth cannot exceed ${DOS_PROTECTION.MAX_DEPTH}`)
      .optional()
      .default(1)
      .describe('The depth of relationships to traverse for translation'),
  })
  .strict() // Reject unknown fields
  .refine(
    (data) => Boolean(data.collectionSlug) || Boolean(data.globalSlug),
    {
      message: 'Either collectionSlug or globalSlug must be provided',
      path: ['collectionSlug', 'globalSlug'],
    },
  )
  .refine(
    (data) => !(Boolean(data.collectionSlug) && Boolean(data.globalSlug)),
    {
      message: 'Cannot provide both collectionSlug and globalSlug',
      path: ['collectionSlug', 'globalSlug'],
    },
  )
  .refine(
    (data) => data.fromLocale !== data.toLocale,
    {
      message: 'fromLocale and toLocale must be different',
      path: ['toLocale'],
    },
  )

/**
 * Inferred TypeScript type from the Zod schema
 * Use this type for type-safe handling of validated request data
 */
export type ValidatedTranslateArgs = z.infer<typeof translateEndpointSchema>

/**
 * DoS protection constants for external use
 */
export const DOS_LIMITS = DOS_PROTECTION

/**
 * Supported locales for external use
 */
export const VALID_LOCALES = SUPPORTED_LOCALES

/**
 * Helper function to validate translate endpoint arguments
 * @param data - Raw request data to validate
 * @returns Promise<ValidatedTranslateArgs> - Validated and typed data
 * @throws ZodError - If validation fails
 */
export async function validateTranslateArgs(data: unknown): Promise<ValidatedTranslateArgs> {
  return translateEndpointSchema.parseAsync(data)
}

/**
 * Safe validation that returns either success or error object
 * @param data - Raw request data to validate
 * @returns Object with success flag and either data or error
 */
export async function safeValidateTranslateArgs(data: unknown): Promise<
  | { success: true; data: ValidatedTranslateArgs }
  | { success: false; error: z.ZodError }
> {
  const result = await translateEndpointSchema.safeParseAsync(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, error: result.error }
}