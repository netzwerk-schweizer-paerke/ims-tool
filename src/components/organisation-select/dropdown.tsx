'use client'

import { toNumber } from 'lodash-es'
import ky from 'ky'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { Organisation } from '@/payload-types'
import { Select } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { Translate } from '@/lib/translate'

type Props = {
  userId?: number
  orgs?: Organisation[]
  selectedOrg?: Organisation
}

export const UserOrganisationSelect: React.FC<Props> = ({ orgs, userId, selectedOrg }) => {
  const [orgLangMismatch, setOrgLangMismatch] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const locale = searchParams.get('locale')
    if (locale) {
      if (locale !== selectedOrg?.organisationLanguage) {
        logger.debug('Selected locale does not match selected org', {
          locale,
          selectedOrg: selectedOrg?.organisationLanguage,
        })
        setOrgLangMismatch(true)
      }
    } else {
      if (selectedOrg?.organisationLanguage !== 'de') {
        setOrgLangMismatch(true)
      }
    }
  }, [selectedOrg])

  const setLanguageParam = (selectedOrg?: Organisation) => {
    if (!selectedOrg || !selectedOrg.organisationLanguage) return
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('locale')) {
      searchParams.delete('locale')
    }
    searchParams.append('locale', selectedOrg?.organisationLanguage)
    window.history.pushState(null, '', `${window.location.pathname}?${searchParams.toString()}`)
    window.document.location.reload()
  }

  const onChange = async (option: { value: any }) => {
    const selectedId = toNumber(option.value)
    await ky.patch(`/api/users/${userId}`, {
      json: {
        selectedOrganisation: selectedId,
      },
      credentials: 'include',
    })
    const selectedOrg = orgs?.find((org) => org.id === selectedId)
    setLanguageParam(selectedOrg)
  }

  const currentOrgId = getIdFromRelation(selectedOrg) as number

  const options =
    orgs?.map((org) => {
      return {
        value: `${org.id}`,
        label: org.name,
      }
    }) || []

  const selectedOption = options.find((option) => option.value === `${currentOrgId}`)

  return (
    <>
      <Select
        options={options}
        value={selectedOption}
        onChange={onChange as any}
        isCreatable={false}
        isClearable={false}
      />
      {orgLangMismatch && (
        <div className={'mt-4 rounded-lg border px-2'}>
          <p className="mt-2">
            <Translate k={'admin:selectOrganisations:orgLanguageMismatch'} />
          </p>
          <button
            onClick={() => setLanguageParam(selectedOrg)}
            type={'button'}
            className={'btn btn--style-pill btn--size-small my-2'}>
            Reset
          </button>
        </div>
      )}
    </>
  )
}
