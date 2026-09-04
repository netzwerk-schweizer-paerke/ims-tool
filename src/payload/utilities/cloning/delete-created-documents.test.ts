import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

import { deleteCreatedDocuments } from './delete-created-documents'

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const makeReq = (deleteMock: Mock): PayloadRequest =>
  ({ payload: { delete: deleteMock, logger } }) as unknown as PayloadRequest

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteCreatedDocuments', () => {
  // The delete runs the Documents afterRead hook, so the request carries its opt-out.
  test('deletes each document with the access rule overridden and the usage scan off', async () => {
    const deleteMock = vi.fn().mockResolvedValue({})
    const req = makeReq(deleteMock)
    const quietReq = { ...req, context: { skipDocumentUsage: true } }

    await deleteCreatedDocuments(req, [900, 901])

    expect(deleteMock.mock.calls.map(([options]) => options)).toEqual([
      { collection: 'documents', id: 900, overrideAccess: true, req: quietReq },
      { collection: 'documents', id: 901, overrideAccess: true, req: quietReq },
    ])
  })

  // The caller answers the error that caused the rollback. A cleanup failure must not replace it.
  test('logs a failed delete, deletes the rest, and never rejects', async () => {
    const deleteMock = vi.fn().mockRejectedValueOnce(new Error('NotFound')).mockResolvedValue({})

    await expect(deleteCreatedDocuments(makeReq(deleteMock), [900, 901])).resolves.toBeUndefined()

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 900, error: 'NotFound' }),
    )
  })
})
