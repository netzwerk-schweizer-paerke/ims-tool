/**
 * Centralized Zod validation schemas for cloning endpoints
 * Provides comprehensive validation, sanitization, and type safety
 */

import { z } from 'zod'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates MongoDB ObjectId format
 * Accepts both string and numeric IDs
 */
const isValidObjectId = (value: string): boolean => {
  // Check if it's a numeric ID (converted to string)
  if (/^\d+$/.test(value)) {
    return true
  }
  // Check if it's a valid MongoDB ObjectId (24 hex characters)
  return /^[0-9a-fA-F]{24}$/.test(value)
}

/**
 * Sanitizes string input to prevent XSS attacks
 * Removes dangerous characters while preserving safe content
 */
const sanitizeString = (value: string): string => {
  return value
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replaceAll(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replaceAll(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replaceAll(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replaceAll(/javascript:/gi, '') // Remove javascript: protocol
    .replaceAll(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Schema for validating ID parameters
 * Accepts string or number, validates format
 */
export const idSchema = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(isValidObjectId, {
    message: 'Invalid ID format. Must be a valid MongoDB ObjectId or numeric ID',
  })

/**
 * Schema for optional ID parameters
 */
export const optionalIdSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .optional()
  .transform((val) => (val ? String(val) : undefined))
  .refine((val) => !val || isValidObjectId(val), {
    message: 'Invalid ID format. Must be a valid MongoDB ObjectId or numeric ID',
  })

/**
 * Schema for name fields with XSS sanitization
 */
export const nameSchema = z
  .string()
  .max(255, 'Name must not exceed 255 characters')
  .transform(sanitizeString)
  .optional()

/**
 * Schema for boolean flags
 */
export const booleanFlagSchema = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val
    return val === 'true' || val === '1'
  })
  .optional()

// ============================================================================
// Activity Clone Schemas
// ============================================================================

/**
 * Request parameters for activity cloning endpoint
 * Used in URL path: /activities/:activityId/organisation/:organisationId
 */
export const activityCloneParamsSchema = z.object({
  activityId: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: 'activityId must be a positive number',
    }),
  organisationId: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: 'organisationId must be a positive number',
    }),
})

/**
 * Query parameters for activity cloning endpoint
 */
export const activityCloneQuerySchema = z.object({
  failTest: booleanFlagSchema,
})

/**
 * Request body for activity cloning endpoint (if needed in future)
 */
export const activityCloneBodySchema = z.object({
  name: nameSchema,
  targetModuleId: optionalIdSchema,
  targetPhaseId: optionalIdSchema,
  targetProjectId: optionalIdSchema,
})

/**
 * Complete request schema for activity cloning
 */
export const activityCloneRequestSchema = z.object({
  body: activityCloneBodySchema.optional(),
  params: activityCloneParamsSchema,
  query: activityCloneQuerySchema.optional(),
})

// ============================================================================
// TaskFlow Clone Schemas
// ============================================================================

/**
 * Request body for task flow cloning endpoint
 */
export const taskFlowCloneBodySchema = z.object({
  name: nameSchema,
  targetModuleId: optionalIdSchema,
  targetOrganisationId: idSchema,
  targetPhaseId: optionalIdSchema,
  targetProjectId: optionalIdSchema,
})

/**
 * Route parameters for task flow cloning endpoint
 */
export const taskFlowCloneParamsSchema = z.object({
  id: idSchema,
})

/**
 * Complete request schema for task flow cloning
 */
export const taskFlowCloneRequestSchema = z.object({
  body: taskFlowCloneBodySchema,
  params: taskFlowCloneParamsSchema,
})

// ============================================================================
// TaskList Clone Schemas
// ============================================================================

/**
 * Request body for task list cloning endpoint
 */
export const taskListCloneBodySchema = z.object({
  name: nameSchema,
  targetModuleId: optionalIdSchema,
  targetOrganisationId: idSchema,
  targetPhaseId: optionalIdSchema,
  targetProjectId: optionalIdSchema,
})

/**
 * Route parameters for task list cloning endpoint
 */
export const taskListCloneParamsSchema = z.object({
  id: idSchema,
})

/**
 * Complete request schema for task list cloning
 */
export const taskListCloneRequestSchema = z.object({
  body: taskListCloneBodySchema,
  params: taskListCloneParamsSchema,
})

// ============================================================================
// Type Exports
// ============================================================================

export type ActivityCloneBody = z.infer<typeof activityCloneBodySchema>
// Inferred TypeScript types from Zod schemas
export type ActivityCloneParams = z.infer<typeof activityCloneParamsSchema>
export type ActivityCloneQuery = z.infer<typeof activityCloneQuerySchema>
export type ActivityCloneRequest = z.infer<typeof activityCloneRequestSchema>

export type TaskFlowCloneBody = z.infer<typeof taskFlowCloneBodySchema>
export type TaskFlowCloneParams = z.infer<typeof taskFlowCloneParamsSchema>
export type TaskFlowCloneRequest = z.infer<typeof taskFlowCloneRequestSchema>

export type TaskListCloneBody = z.infer<typeof taskListCloneBodySchema>
export type TaskListCloneParams = z.infer<typeof taskListCloneParamsSchema>
export type TaskListCloneRequest = z.infer<typeof taskListCloneRequestSchema>

// ============================================================================
// Validation Error Formatting
// ============================================================================

/**
 * Formats Zod validation errors into a structured response
 * @param error - Zod validation error
 * @returns Formatted error object for API response
 */
export function formatValidationErrors(error: z.ZodError<any>) {
  return {
    errors: error.issues.map((issue) => ({
      code: issue.code,
      field: issue.path.join('.'),
      message: issue.message,
    })),
    message: 'Validation failed',
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates request data and returns parsed result or error response
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data or validation error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { data: T; success: true; }
  | { error: ReturnType<typeof formatValidationErrors>; success: false; } {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      error: formatValidationErrors(result.error),
      success: false,
    }
  }

  return {
    data: result.data,
    success: true,
  }
}

// ============================================================================
// Security Notes
// ============================================================================

/**
 * Security considerations implemented in these schemas:
 *
 * 1. ID Validation: Prevents injection by validating ID format
 * 2. String Sanitization: Removes XSS vectors from user input
 * 3. Length Limits: Prevents resource exhaustion attacks
 * 4. Type Coercion: Ensures data types are correct before processing
 * 5. Strict Parsing: Strips unexpected fields from request body
 *
 * Rate limiting should be implemented at the endpoint level using
 * appropriate middleware (e.g., express-rate-limit)
 *
 * Additional security measures to consider:
 * - CORS configuration
 * - Request size limits
 * - Authentication token validation
 * - IP-based rate limiting
 * - Request logging for audit trails
 */
