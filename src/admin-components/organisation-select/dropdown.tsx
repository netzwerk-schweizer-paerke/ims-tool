'use client';

import { toNumber } from 'lodash-es';
import ky from 'ky';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { Organisation, User } from '@/types/payload-types';

type Props = {
  userId?: number;
  orgs?: Organisation[];
  selectedOrgId?: User['selectedOrganisation'];
};

export const UserOrganisationSelect: React.FC<Props> = ({ orgs, userId, selectedOrgId }) => {
  const onChangeHandler = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = toNumber(e.target.value);
    await ky.patch(`/api/users/${userId}`, {
      json: {
        selectedOrganisation: selectedId,
      },
      credentials: 'include',
    });
    window.document.location.reload();
  };

  const currentOrgId = getIdFromRelation(selectedOrgId) as number;

  return (
    <select
      className="select select-bordered w-full"
      value={currentOrgId}
      onChange={onChangeHandler}>
      {orgs?.map((org) => {
        return (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        );
      })}
    </select>
  );
};
