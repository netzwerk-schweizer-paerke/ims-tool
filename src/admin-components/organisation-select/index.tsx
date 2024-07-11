import React from 'react';
import { payload } from '@/lib/payload';
import { headers as getHeaders } from 'next/headers';
import { compact } from 'lodash-es';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { UserOrganisationSelect } from '@/admin-components/organisation-select/dropdown';
import { Translate } from '@/lib/translate';

export const OrganisationSelect: React.FC = async () => {
  const headers = getHeaders();
  const client = await payload();

  const { user } = await client.auth({ headers });

  const organisations = await client.find({
    collection: 'organisations',
  });

  const userOrganisations = compact(
    user?.organisations?.map((userOrg) => {
      if (!userOrg) return;

      const thisOrg = organisations.docs.find(
        (org) => org.id === getIdFromRelation(userOrg.organisation),
      );
      if (!thisOrg) return;
      return thisOrg;
    }),
  );

  if (!userOrganisations || userOrganisations.length === 0) {
    return null;
  }

  return (
    <div className={'mb-8 w-full'}>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">
            <Translate k={'admin:selectOrganisations:title'} />
          </span>
        </div>
        <UserOrganisationSelect
          orgs={userOrganisations}
          userId={user?.id}
          selectedOrgId={user?.selectedOrganisation}
        />
      </label>
    </div>
  );
};
