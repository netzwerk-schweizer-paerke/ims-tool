import { GenericCloneButton } from '@/payload/utilities/cloning/ui/GenericCloneButton'
import { CloneTaskListOverlay } from './clone-task-list-overlay'
import { User } from '@/payload-types'
import { Payload } from 'payload'

export const baseClass = 'clone-task-list-button'
export const drawerSlug = 'clone-task-lists'

type Props = {
  user: User
  payload: Payload
}

export const CloneTaskListsButton: React.FC<Props> = async ({ user, payload }) => {
  return (
    <GenericCloneButton
      user={user}
      payload={payload}
      collectionSlug="task-lists"
      translationKey="cloneTaskList:button"
      drawerSlug={drawerSlug}
      baseClass={baseClass}
      OverlayComponent={CloneTaskListOverlay}
    />
  )
}
