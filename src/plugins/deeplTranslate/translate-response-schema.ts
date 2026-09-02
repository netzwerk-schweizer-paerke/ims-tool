import { z } from 'zod'

/**
 * The response contract of POST /api/deepltranslate/translate.
 *
 * The endpoint and the client both use this file. The server builds its response with
 * `satisfies`, so a drift fails the type check. The client parses the received JSON,
 * because a wire response is untyped.
 */

export const translateErrorTypeSchema = z.enum([
  'authentication',
  'generic',
  'network',
  'quota_exceeded',
])

export type TranslateErrorType = z.infer<typeof translateErrorTypeSchema>

export const relationshipStatsSchema = z.object({
  failed: z.number().int().nonnegative(),
  failedDocs: z.array(z.string()),
  skipped: z.number().int().nonnegative(),
  success: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

export type RelationshipStats = z.infer<typeof relationshipStatsSchema>

export const translateSuccessResponseSchema = z.object({
  collection: z.string(),
  id: z.union([z.string(), z.number()]),
  message: z.string(),
  statistics: z.object({
    mainDocument: z.literal('translated'),
    relationships: relationshipStatsSchema,
  }),
  success: z.literal(true),
})

/** What `translateDocument` returns to a component. */
export type TranslateResult =
  | { data: TranslateSuccessResponse; success: true }
  | { error: string; errorType: TranslateErrorType; success: false }

export type TranslateSuccessResponse = z.infer<typeof translateSuccessResponseSchema>
