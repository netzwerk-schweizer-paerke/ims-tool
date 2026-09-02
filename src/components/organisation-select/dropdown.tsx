'use client'

import { Select, toast, useConfig, usePreferences, useTranslation } from '@payloadcms/ui'
import { toNumber } from 'es-toolkit/compat'
import ky from 'ky'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { logger } from '@/lib/logger'
import {
  consumeOrganisationSwitchNotice,
  navigateAfterOrganisationSwitch,
} from '@/lib/organisation-switch-target'
import { Translate } from '@/lib/translate'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
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
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { config } = useConfig()
  const params = useSearchParams()
  const paramsLocale = params.get('locale')

  // organisationLanguage is optional, so a row created before the field existed holds null.
  // Payload's own default locale is the last resort.
  const defaultLocale = config.localization ? config.localization.defaultLocale : undefined
  const languageOf = (org?: Organisation) => org?.organisationLanguage ?? defaultLocale
  const selectedOrgLanguage = languageOf(selectedOrg)

  // The switch redirects through a full page load, so the notice crosses in session storage.
  // Payload mounts its toast container above this component, so the sonner subscriber is not
  // ready during a mount effect. A zero delay defers the call until every mount effect has run.
  useEffect(() => {
    if (!consumeOrganisationSwitchNotice()) return

    setTimeout(() => {
      // Payload's toast default is 4000 ms. This notice explains a redirect, so it stays longer.
      toast.info(t('admin:selectOrganisations:switchedAwayFromDocument'), { duration: 12_000 })
    }, 0)
  }, [t])

  const applyLanguagePreference = async (org?: Organisation) => {
    const language = languageOf(org)
    if (!language) return
    await setPreference('locale', language)

    // Remove the locale parameter from the URL if it exists
    if (paramsLocale) {
      const url = new URL(window.location.href)
      url.searchParams.delete('locale')
      window.history.replaceState({}, '', url)
    }
  }

  // A language reset keeps the current page. Only an organisation switch redirects.
  const resetLanguagePreference = async (org?: Organisation) => {
    await applyLanguagePreference(org)
    window.location.reload()
  }

  useEffect(() => {
    getPreference<string>('locale')
      .then((locale) => {
        if (paramsLocale && paramsLocale !== locale) {
          window.location.reload()
        }
        if (locale && locale !== selectedOrgLanguage) {
          logger.debug('Selected locale does not match selected org', {
            locale,
            selectedOrg: selectedOrgLanguage,
          })
          setOrgLangMismatch(true)
        }
      })
      .catch((error) => {
        console.error('Error fetching locale preference:', error)
      })
  }, [getPreference, paramsLocale, selectedOrgLanguage])

  const onChange = async (option: { value: any }) => {
    const selectedId = toNumber(option.value)
    await ky.patch(`/api/users/${userId}`, {
      credentials: 'include',
      json: {
        selectedOrganisation: selectedId,
      },
    })
    // The organisation changed above. A failed locale write must not abort the redirect, because
    // the user then stays on a document that the new organisation cannot read.
    const targetOrg = orgs?.find((org) => org.id === selectedId)
    try {
      await applyLanguagePreference(targetOrg)
    } catch (error) {
      console.error('Failed to set the locale preference after the switch:', error)
    }
    navigateAfterOrganisationSwitch()
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
            onClick={() => resetLanguagePreference(selectedOrg)}
            type={'button'}>
            <Translate k={'admin:selectOrganisations:reset'} />
          </button>
        </div>
      )}
    </>
  )
}
