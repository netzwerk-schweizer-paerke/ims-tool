import { checkUserRoles } from './checkUserRoles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { User } from '@/payload-types'

export const isAdmin = (user: User | null): boolean => checkUserRoles([ROLE_SUPER_ADMIN], user)
