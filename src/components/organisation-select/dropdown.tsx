'use client'

import { Select, usePreferences } from '@payloadcms/ui'
import { toNumber } from 'es-toolkit/compat'
import ky from 'ky'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { logger } from '@/lib/logger'
import { Translate } from '@/lib/translate'
import { Organisation } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

type Props = {
  orgs?: Organisation[]
  selectedOrg?: Organisation
  userId?: number
}

export const UserOrganisationSelect: React.FC<Props> = ({ orgs, selectedOrg, userId }) => {
  const [orgLangMismatch, setOrgLangMismatch] = useState(false)
  const { getPreference, setPreference } = usePreferences()
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
      credentials: 'include',
      json: {
        selectedOrganisation: selectedId,
      },
    })
    const selectedOrg = orgs?.find((org) => org.id === selectedId)
    await setLanguagePreference(selectedOrg)
  }

  const currentOrgId = getIdFromRelation(selectedOrg) as number

  const options =
    orgs?.map((org) => {
      return {
        label: org.name,
        value: `${org.id}`,
      }
    }) || []

  const selectedOption = options.find((option) => option.value === `${currentOrgId}`)

  return (
    <>
      <Select
        isClearable={false}
        isCreatable={false}
        onChange={onChange as any}
        options={options}
        value={selectedOption}
      />
      {orgLangMismatch && (
        <div className={'mt-4 rounded-lg border px-2'}>
          <p className="mt-2">
            <Translate k={'admin:selectOrganisations:orgLanguageMismatch'} />
          </p>
          <button
            className={'btn btn--style-pill btn--size-small my-2'}
            onClick={() => setLanguagePreference(selectedOrg)}
            type={'button'}>
            <Translate k={'admin:selectOrganisations:reset'} />
          </button>
        </div>
      )}
    </>
  )
}
