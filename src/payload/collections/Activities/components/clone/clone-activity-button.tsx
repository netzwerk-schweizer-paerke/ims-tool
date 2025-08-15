import { GenericCloneButton } from '@/payload/utilities/cloning/ui/GenericCloneButton'
import { CloneActivityOverlay } from '@/payload/collections/Activities/components/clone/clone-activity-overlay'
import { User } from '@/payload-types'
import { Payload } from 'payload'

export const baseClass = 'clone-activity-button'
export const drawerSlug = 'clone-activities'

type Props = {
  user: User
  payload: Payload
}

export const CloneActivityButton: React.FC<Props> = async ({ user, payload }) => {
  return (
    <GenericCloneButton
      user={user}
      payload={payload}
      collectionSlug="activities"
      translationKey="cloneActivity:button"
      drawerSlug={drawerSlug}
      baseClass={baseClass}
      OverlayComponent={CloneActivityOverlay}
    />
  )
}
