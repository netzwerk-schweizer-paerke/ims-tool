import { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreateUserAfterChangeHook: CollectionAfterChangeHook = async ({
  doc,
  req,
  req: { payload, body = {} },
  operation,
}) => {
  if (operation === 'create' && !req.user) {
    const { email, password } = body as any

    if (email && password) {
      const { user, token } = await payload.login({
        collection: 'users',
        data: { email, password },
        req,
      })

      return {
        ...doc,
        token,
        user,
      }
    }
  }

  return doc
}
