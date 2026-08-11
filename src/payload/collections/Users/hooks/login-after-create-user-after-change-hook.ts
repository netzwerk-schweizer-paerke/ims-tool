import { CollectionAfterChangeHook } from 'payload'

export const loginAfterCreateUserAfterChangeHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  req: { body = {}, payload },
}) => {
  if (operation === 'create' && !req.user) {
    const { email, password } = body as any

    if (email && password) {
      const { token, user } = await payload.login({
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
