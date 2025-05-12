export const ROLE_SUPER_ADMIN = 'admin'
export const ROLE_USER = 'user'

export type Roles = (typeof ROLE_SUPER_ADMIN | typeof ROLE_USER)[]
