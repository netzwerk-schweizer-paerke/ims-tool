/**
 * Error carrying the HTTP status a clone endpoint should respond with.
 *
 * The clone handlers wrap their whole body in one try/catch, so without a status
 * on the error every failure collapses into a 500 — an access denial and a
 * Payload ValidationError become indistinguishable to the caller, and the admin
 * UI can only report "HTTP 500 error".
 */
export class CloneHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CloneHttpError'
    this.status = status
  }
}

/**
 * Field-level detail from a Payload `ValidationError`.
 *
 * `error.message` only says *that* a field is invalid ("The following field is invalid: id")
 * — never which document or which path. Without this, a failing clone gives no way to find
 * the offending record.
 */
export const getValidationDetails = (error: unknown): string[] => {
  if (!error || typeof error !== 'object') {
    return []
  }

  const { data } = error as { data?: { errors?: unknown } }

  if (!data || !Array.isArray(data.errors)) {
    return []
  }

  return data.errors.map((issue) => {
    const { label, message, path } = issue as {
      label?: string
      message?: string
      path?: string
    }

    return [path ?? label, message].filter(Boolean).join(': ')
  })
}

/**
 * Payload's APIError and ValidationError both expose a `status`, as does
 * CloneHttpError. Anything else is a genuine server fault and stays a 500.
 */
export const getErrorStatus = (error: unknown): number => {
  if (error && typeof error === 'object' && 'status' in error) {
    const { status } = error as { status?: unknown }

    if (typeof status === 'number' && status >= 400 && status <= 599) {
      return status
    }
  }

  return 500
}
