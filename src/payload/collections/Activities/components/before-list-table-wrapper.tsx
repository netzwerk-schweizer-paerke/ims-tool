import { User } from '@/payload-types'
import { Payload } from 'payload'
// import { FetchLegacyDocsButton } from '@/payload/collections/Activities/components/legacy-fetcher/fetch-legacy-docs-button'
import { CloneActivityButton } from '@/payload/collections/Activities/components/clone/clone-activity-button'
// import { checkUserRoles } from '@/payload/utilities/check-user-roles'
// import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

type Props = {
  user: User
  payload: Payload
}

export const BeforeListTableWrapper: React.FC<Props> = async ({ user, payload }) => {
  // const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  return (
    <div className={'flex gap-6'}>
      <CloneActivityButton user={user} payload={payload} />
      {/*{isSuperAdmin && <FetchLegacyDocsButton user={user} payload={payload} />}*/}
    </div>
  )
}
