import { DrawerToggler } from '@payloadcms/ui'
import { toNumber } from 'es-toolkit/compat'
import React from 'react'

import { Translate } from '@/lib/translate'
import { User } from '@/payload-types'
import { TenantHealthOverlay } from '@/payload/collections/Activities/components/health/tenant-health-overlay'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export const baseClass = 'tenant-health-button'
export const drawerSlug = 'tenant-health'

type Props = {
  user: User
}

/**
 * Runs the data health check against the park currently selected in the sidebar.
 *
 * Super-admin only, matching the endpoint: the checker reads with `overrideAccess` and the
 * report can name rows in other organisations.
 */
export const TenantHealthButton: React.FC<Props> = ({ user }) => {
  if (!user || !checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return null
  }

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))

  if (!selectedOrgId) {
    return null
  }

  return (
    <div>
      <DrawerToggler
        className={`${baseClass}__open btn btn--size-medium btn--style-secondary`}
        slug={drawerSlug}>
        <Translate k={'dataHealth:button' as never} />
      </DrawerToggler>
      <TenantHealthOverlay organisationId={selectedOrgId} />
    </div>
  )
}
