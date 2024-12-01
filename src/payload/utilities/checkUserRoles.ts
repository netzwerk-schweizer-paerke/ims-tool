import { User } from '@/payload-types'
import { logger } from '@/lib/logger'

export const checkUserRoles = (allRoles: User['roles'] = [], user: User | null): boolean => {
  let checkResult = false
  if (user) {
    if (
      allRoles.some((role) => {
        checkResult = user?.roles?.some((individualRole) => {
          return individualRole === role
        })
      })
    )
      checkResult = true
  }

  logger.debug(`🔒checkUserRoles: ${checkResult}`, { allRoles, user: user?.roles })

  return checkResult
}
