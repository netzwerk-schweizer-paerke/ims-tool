import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const payload = async () => {
  return getPayload({ config: await configPromise })
}
