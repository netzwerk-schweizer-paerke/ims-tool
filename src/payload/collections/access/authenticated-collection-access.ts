import type { Access } from 'payload'
import { User } from '@/payload-types'

/**
 * Access control function that checks if a user is authenticated.
 *
 * This simple function verifies that a user is logged in before granting access.
 * It serves as a basic authentication check for collections that should only be
 * accessible to authenticated users regardless of their role or organization.
 *
 * According to the access management assumptions, this implements the requirement
 * that only authenticated users can access certain resources in the system.
 *
 * @param {object} params - The access control parameters
 * @returns {boolean} - Returns true if the user is authenticated, false otherwise
 */
export const authenticatedCollectionAccess: Access<User> = ({ req: { user } }) => {
  return Boolean(user)
}
