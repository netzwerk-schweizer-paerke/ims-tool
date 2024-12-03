import { addDataAndFileToRequest } from '@payloadcms/next/utilities'
import { PayloadRequest } from 'payload'

type RequestData<TParams, TBody> = {
  params?: TParams
  body?: TBody
}

export const getRequestData = async <TData extends { params?: any; body?: any }>(
  req: PayloadRequest,
): Promise<RequestData<TData['params'], TData['body']>> => {
  await addDataAndFileToRequest(req)
  const params = req.routeParams as TData['params'] | undefined
  const body = req.data as TData['body'] | undefined
  return { params, body }
}
