import { Payload } from 'payload'

import { User } from '@/payload-types'
// import { FetchLegacyDocsButton } from '@/payload/collections/Activities/components/legacy-fetcher/fetch-legacy-docs-button'
import { CloneActivityButton } from '@/payload/collections/Activities/components/clone/clone-activity-button'
// import { checkUserRoles } from '@/payload/utilities/check-user-roles'
// import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

type Props = {
  payload: Payload
  user: User
}

export const BeforeListTableWrapper = async ({ payload, user }: Props) => {
  // const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  return (
    <div className={'flex gap-6'}>
      <CloneActivityButton payload={payload} user={user} />
      {/*{isSuperAdmin && <FetchLegacyDocsButton user={user} payload={payload} />}*/}
    </div>
  )
}
