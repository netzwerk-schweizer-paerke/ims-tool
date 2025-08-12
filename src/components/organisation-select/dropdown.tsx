'use client'

import { toNumber } from 'lodash-es'
import ky from 'ky'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { Organisation } from '@/payload-types'
import { Select, usePreferences } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { Translate } from '@/lib/translate'
import { useSearchParams } from 'next/navigation'

type Props = {
  userId?: number
  orgs?: Organisation[]
  selectedOrg?: Organisation
}

export const UserOrganisationSelect: React.FC<Props> = ({ orgs, userId, selectedOrg }) => {
  const [orgLangMismatch, setOrgLangMismatch] = useState(false)
  const { setPreference, getPreference } = usePreferences()
  const params = useSearchParams()
  const paramsLocale = params.get('locale')

  const setLanguagePreference = async (selectedOrg?: Organisation) => {
    if (!selectedOrg || !selectedOrg.organisationLanguage) return
    await setPreference('locale', selectedOrg.organisationLanguage)

    // Remove the locale parameter from the URL if it exists
    if (paramsLocale) {
      const url = new URL(window.location.href)
      url.searchParams.delete('locale')
      window.history.replaceState({}, '', url)
    }

    window.location.reload()
  }

  useEffect(() => {
    getPreference<string>('locale')
      .then((locale) => {
        if (paramsLocale && paramsLocale !== locale) {
          window.location.reload()
        }
        if (locale && locale !== selectedOrg?.organisationLanguage) {
          logger.debug('Selected locale does not match selected org', {
            locale,
            selectedOrg: selectedOrg?.organisationLanguage,
          })
          setOrgLangMismatch(true)
        }
      })
      .catch((error) => {
        console.error('Error fetching locale preference:', error)
      })
  }, [getPreference, paramsLocale, selectedOrg?.organisationLanguage])

  const onChange = async (option: { value: any }) => {
    const selectedId = toNumber(option.value)
    await ky.patch(`/api/users/${userId}`, {
      json: {
        selectedOrganisation: selectedId,
      },
      credentials: 'include',
    })
    const selectedOrg = orgs?.find((org) => org.id === selectedId)
    await setLanguagePreference(selectedOrg)
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
            onClick={() => setLanguagePreference(selectedOrg)}
            type={'button'}
            className={'btn btn--style-pill btn--size-small my-2'}>
            <Translate k={'admin:selectOrganisations:reset'} />
          </button>
        </div>
      )}
    </>
  )
}
