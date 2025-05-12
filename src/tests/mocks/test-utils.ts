import type { Organisation, User } from '@/payload-types'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'

export const mockOrganisations: Record<string, Organisation> = {
  org1: {
    id: 1,
    name: 'Test Organisation 1',
    organisationLanguage: 'en',
    updatedAt: '',
    createdAt: '',
  },
  org2: {
    id: 2,
    name: 'Test Organisation 2',
    organisationLanguage: 'en',
    updatedAt: '',
    createdAt: '',
  },
  org3: {
    id: 3,
    name: 'Test Organisation 3',
    organisationLanguage: 'en',
    updatedAt: '',
    createdAt: '',
  },
}

export const createMockUser = (options: {
  id?: number
  email?: string
  roles?: (typeof ROLE_SUPER_ADMIN | typeof ROLE_USER)[]
  selectedOrganisation?: Organisation | null
}): User => {
  const {
    id = 1,
    email = 'user@example.com',
    roles = [ROLE_USER],
    selectedOrganisation = null,
  } = options

  return {
    id,
    email,
    roles,
    selectedOrganisation,
    updatedAt: '',
    createdAt: '',
  }
}

export const mockUsers = {
  admin: createMockUser({
    id: 1,
    email: 'admin@example.com',
    roles: [ROLE_SUPER_ADMIN],
  }),

  regularUser: createMockUser({
    id: 2,
    email: 'user@example.com',
    roles: [ROLE_USER],
  }),

  otherRoleUser: createMockUser({
    id: 3,
    email: 'other@example.com',
    // @ts-expect-error Test role that does not exist
    roles: ['other-role'],
  }),

  noRolesUser: createMockUser({
    id: 4,
    email: 'noroles@example.com',
    roles: [],
  }),

  userWithOrg1: createMockUser({
    id: 5,
    email: 'userwithorg1@example.com',
    roles: [ROLE_USER],
    selectedOrganisation: mockOrganisations.org1,
  }),

  userWithOrg2: createMockUser({
    id: 6,
    email: 'userwithorg2@example.com',
    roles: [ROLE_USER],
    selectedOrganisation: mockOrganisations.org2,
  }),

  adminWithOrg1: createMockUser({
    id: 7,
    email: 'adminwithorg1@example.com',
    roles: [ROLE_SUPER_ADMIN],
    selectedOrganisation: mockOrganisations.org1,
  }),
}

export const createMockData = (organisationId: number | null = null) => {
  if (!organisationId) return {}

  const matchingOrg = Object.values(mockOrganisations).find((org) => org.id === organisationId)

  return {
    organisation: matchingOrg || { id: organisationId },
  }
}

export const createMockRequest = (user: User) => {
  return { user }
}
