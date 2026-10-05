import type { ServerProps } from 'payload'

import { DocumentHealthButton } from '@/payload/components/health/document-health-button'
import { isParkAdmin } from '@/payload/utilities/is-park-admin'

/**
 * A reader may open a document but not check it (PIMS-92). The role check runs on the server,
 * because the role helpers import the tslog logger.
 */
export const DocumentHealthControl = ({ user }: ServerProps) =>
  isParkAdmin(user) ? <DocumentHealthButton /> : null
