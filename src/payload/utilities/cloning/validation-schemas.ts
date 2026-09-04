import { z } from 'zod'

/**
 * Formats Zod validation errors into a structured response
 * @param error - Zod validation error
 * @returns Formatted error object for API response
 */
export function formatValidationErrors(error: z.ZodError) {
  return {
    errors: error.issues.map((issue) => ({
      code: issue.code,
      field: issue.path.join('.'),
      message: issue.message,
    })),
    message: 'Validation failed',
  }
}
