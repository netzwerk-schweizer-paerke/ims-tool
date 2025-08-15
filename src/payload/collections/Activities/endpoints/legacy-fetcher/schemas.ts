import { z } from 'zod'

// Request validation schema
export const FetchLegacyDocsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
})

export type FetchLegacyDocsParams = z.infer<typeof FetchLegacyDocsSchema>
