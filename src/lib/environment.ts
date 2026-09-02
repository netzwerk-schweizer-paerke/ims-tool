/**
 * Environment utility functions and constants
 */

export const isDevelopment = process.env.NODE_ENV !== 'production'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * True only on a local `next dev` server, which sets NODE_ENV to `development`.
 *
 * `isDevelopment` is the negation of production, so it is also true for a staging image and
 * for any script that runs with NODE_ENV unset. Gate a destructive side effect on this instead.
 */
export const isLocalDevelopment = process.env.NODE_ENV === 'development'
