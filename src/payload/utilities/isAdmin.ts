import { checkUserRoles } from './checkUserRoles';
import { User } from '../../../payload-types';
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants';

export const isAdmin = (user: User | null): boolean => checkUserRoles([ROLE_SUPER_ADMIN], user);
