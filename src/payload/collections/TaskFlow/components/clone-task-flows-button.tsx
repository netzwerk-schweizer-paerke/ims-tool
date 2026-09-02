import { Payload } from 'payload'

import { User } from '@/payload-types'
import { GenericCloneButton } from '@/payload/utilities/cloning/ui/generic-clone-button'

import { CloneTaskFlowOverlay } from './clone-task-flow-overlay'

export const baseClass = 'clone-task-flow-button'
export const drawerSlug = 'clone-task-flows'

type Props = {
  payload: Payload
  user: User
}

export const CloneTaskFlowsButton = async ({ payload, user }: Props) => {
  return (
    <GenericCloneButton
      baseClass={baseClass}
      collectionSlug="task-flows"
      drawerSlug={drawerSlug}
      OverlayComponent={CloneTaskFlowOverlay}
      payload={payload}
      translationKey="cloneTaskFlow:button"
      user={user}
    />
  )
}
