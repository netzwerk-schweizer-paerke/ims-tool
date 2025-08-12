/**
 * Utility functions for consistent error handling across clone operations
 */

/**
 * Extract safe error message from unknown error object
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Unknown error occurred'
}

/**
 * Format error for logging with context
 */
export const formatError = (error: unknown, context?: Record<string, any>) => {
  return {
    message: getErrorMessage(error),
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    ...(context || {}),
  }
}

/**
 * Wrap async operations with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  logger?: any,
  context?: Record<string, any>,
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    if (logger) {
      logger.error({
        msg: errorMessage,
        ...formatError(error, context),
      })
    }
    throw new Error(`${errorMessage}: ${getErrorMessage(error)}`)
  }
}
