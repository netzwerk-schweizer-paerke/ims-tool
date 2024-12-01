'use client'

import { toNumber } from 'lodash-es'
import ky from 'ky'
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation'
import { Organisation, User } from '@/payload-types'
import { Select } from '@payloadcms/ui'

type Props = {
  userId?: number
  orgs?: Organisation[]
  selectedOrgId?: User['selectedOrganisation']
}

export const UserOrganisationSelect: React.FC<Props> = ({ orgs, userId, selectedOrgId }) => {
  const onChange = async (option: { value: any }) => {
    const selectedId = toNumber(option.value)
    await ky.patch(`/api/users/${userId}`, {
      json: {
        selectedOrganisation: selectedId,
      },
      credentials: 'include',
    })
    window.document.location.reload()
  }

  const currentOrgId = getIdFromRelation(selectedOrgId) as number

  const options =
    orgs?.map((org) => {
      return {
        value: `${org.id}`,
        label: org.name,
      }
    }) || []

  const selectedOption = options.find((option) => option.value === `${currentOrgId}`)

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={onChange as any}
      isCreatable={false}
      isClearable={false}
    />
  )
}
