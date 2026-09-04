import { PayloadRequest } from 'payload'

import { getErrorMessage } from './error-utils'

/**
 * Deletes the documents phase 1 created, after phase 2 rolled back.
 *
 * Each copy committed on its own connection, so the rollback leaves it behind with its S3
 * object, and the storage plugin's afterDelete hook removes that object. A failed delete is
 * logged and never thrown, because the caller still answers the error that caused the rollback.
 */
export const deleteCreatedDocuments = async (
  req: PayloadRequest,
  documentIds: Iterable<number>,
): Promise<void> => {
  for (const id of documentIds) {
    try {
      // The acting user has the source organisation selected, and the write-access rule would
      // filter the copy out. The endpoint already verified the admin role on the target.
      await req.payload.delete({ collection: 'documents', id, overrideAccess: true, req })
    } catch (error) {
      req.payload.logger.error({
        documentId: id,
        error: getErrorMessage(error),
        msg: 'Failed to delete a document the rolled-back run left behind',
      })
    }
  }
}
