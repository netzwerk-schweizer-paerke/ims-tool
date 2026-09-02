import { addDataAndFileToRequest } from '@payloadcms/next/utilities'
import { PayloadRequest } from 'payload'

type RequestData<TParams, TBody> = {
  body?: TBody
  params?: TParams
}

export const getRequestData = async <TData extends { body?: unknown; params?: unknown }>(
  req: PayloadRequest,
): Promise<RequestData<TData['params'], TData['body']>> => {
  await addDataAndFileToRequest(req)
  const params = req.routeParams as TData['params'] | undefined
  const body = req.data as TData['body'] | undefined
  return { body, params }
}
