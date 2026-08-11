import { Payload } from 'payload'

import { User } from '@/payload-types'
import { CloneActivityOverlay } from '@/payload/collections/Activities/components/clone/clone-activity-overlay'
import { GenericCloneButton } from '@/payload/utilities/cloning/ui/generic-clone-button'

export const baseClass = 'clone-activity-button'
export const drawerSlug = 'clone-activities'

type Props = {
  payload: Payload
  user: User
}

export const CloneActivityButton: React.FC<Props> = async ({ payload, user }) => {
  return (
    <GenericCloneButton
      baseClass={baseClass}
      collectionSlug="activities"
      drawerSlug={drawerSlug}
      OverlayComponent={CloneActivityOverlay}
      payload={payload}
      translationKey="cloneActivity:button"
      user={user}
    />
  )
}
