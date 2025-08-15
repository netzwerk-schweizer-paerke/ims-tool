import { GenericCloneButton } from '@/payload/utilities/cloning/ui/GenericCloneButton'
import { CloneTaskFlowOverlay } from './clone-task-flow-overlay'
import { User } from '@/payload-types'
import { Payload } from 'payload'

export const baseClass = 'clone-task-flow-button'
export const drawerSlug = 'clone-task-flows'

type Props = {
  user: User
  payload: Payload
}

export const CloneTaskFlowsButton: React.FC<Props> = async ({ user, payload }) => {
  return (
    <GenericCloneButton
      user={user}
      payload={payload}
      collectionSlug="task-flows"
      translationKey="cloneTaskFlow:button"
      drawerSlug={drawerSlug}
      baseClass={baseClass}
      OverlayComponent={CloneTaskFlowOverlay}
    />
  )
}
