import type { Access } from 'payload';
import { User } from '../../../../payload-types';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';

export const selectedOrganisation: Access<User> = ({ req: { user }, data }) =>
  getIdFromRelation(user?.selectedOrganisation) === data?.id;
