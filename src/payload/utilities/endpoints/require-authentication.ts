import { PayloadRequest } from 'payload'

export const requireAuthentication = (req: PayloadRequest) => {
  if (!req.user) {
    throw Response.json({ error: 'forbidden' }, { status: 403 })
  }
}
