import { Payload } from 'payload'

import { User } from '@/payload-types'
import { GenericCloneButton } from '@/payload/utilities/cloning/ui/generic-clone-button'

import { CloneTaskListOverlay } from './clone-task-list-overlay'

export const baseClass = 'clone-task-list-button'
export const drawerSlug = 'clone-task-lists'

type Props = {
  payload: Payload
  user: User
}

export const CloneTaskListsButton = async ({ payload, user }: Props) => {
  return (
    <GenericCloneButton
      baseClass={baseClass}
      collectionSlug="task-lists"
      drawerSlug={drawerSlug}
      OverlayComponent={CloneTaskListOverlay}
      payload={payload}
      translationKey="cloneTaskList:button"
      user={user}
    />
  )
}
