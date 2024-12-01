import type { FieldAccess } from 'payload'

import { checkUserRoles } from '@/payload/utilities/checkUserRoles'
import { checkOrganisationRoles } from '../utilities/checkOrganisationRoles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { User } from '@/payload-types'
import { isNumber } from 'lodash-es'

export const organisationAdmins: FieldAccess<User> = (args) => {
  const {
    req: { user },
    doc,
  } = args

  return !!(
    checkUserRoles([ROLE_SUPER_ADMIN], user) ||
    doc?.organisations?.some(({ organisation }) => {
      if (!isNumber(organisation)) {
        throw new Error('organisationAdmins: The organisation ID must be a number')
      }
      return checkOrganisationRoles([ROLE_SUPER_ADMIN], user, organisation)
    })
  )
}
