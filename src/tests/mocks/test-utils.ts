import type { Organisation, User } from '@/payload-types'

import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'

export const mockOrganisations: Record<string, Organisation> = {
  org1: {
    createdAt: '',
    id: 1,
    name: 'Test Organisation 1',
    organisationLanguage: 'en',
    updatedAt: '',
  },
  org2: {
    createdAt: '',
    id: 2,
    name: 'Test Organisation 2',
    organisationLanguage: 'en',
    updatedAt: '',
  },
  org3: {
    createdAt: '',
    id: 3,
    name: 'Test Organisation 3',
    organisationLanguage: 'en',
    updatedAt: '',
  },
}

export const createMockUser = (options: {
  email?: string
  id?: number
  roles?: (typeof ROLE_SUPER_ADMIN | typeof ROLE_USER)[]
  selectedOrganisation?: null | Organisation
}): User => {
  const {
    email = 'user@example.com',
    id = 1,
    roles = [ROLE_USER],
    selectedOrganisation = null,
  } = options

  return {
    // Payload 3.87 adds a literal `collection` discriminator to auth user types.
    collection: 'users',
    createdAt: '',
    email,
    id,
    roles,
    selectedOrganisation,
    updatedAt: '',
  }
}

export const mockUsers = {
  admin: createMockUser({
    email: 'admin@example.com',
    id: 1,
    roles: [ROLE_SUPER_ADMIN],
  }),

  adminWithOrg1: createMockUser({
    email: 'adminwithorg1@example.com',
    id: 7,
    roles: [ROLE_SUPER_ADMIN],
    selectedOrganisation: mockOrganisations.org1,
  }),

  noRolesUser: createMockUser({
    email: 'noroles@example.com',
    id: 4,
    roles: [],
  }),

  otherRoleUser: createMockUser({
    email: 'other@example.com',
    id: 3,
    // @ts-expect-error Test role that does not exist
    roles: ['other-role'],
  }),

  regularUser: createMockUser({
    email: 'user@example.com',
    id: 2,
    roles: [ROLE_USER],
  }),

  userWithOrg1: createMockUser({
    email: 'userwithorg1@example.com',
    id: 5,
    roles: [ROLE_USER],
    selectedOrganisation: mockOrganisations.org1,
  }),

  userWithOrg2: createMockUser({
    email: 'userwithorg2@example.com',
    id: 6,
    roles: [ROLE_USER],
    selectedOrganisation: mockOrganisations.org2,
  }),
}

export const createMockData = (organisationId: null | number = null) => {
  if (!organisationId) return {}

  const matchingOrg = Object.values(mockOrganisations).find((org) => org.id === organisationId)

  return {
    organisation: matchingOrg || { id: organisationId },
  }
}

export const createMockRequest = (user: User) => {
  return { user }
}
