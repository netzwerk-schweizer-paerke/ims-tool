'use client'

import { Select, toast, useConfig, usePreferences, useTranslation } from '@payloadcms/ui'
import { toNumber } from 'es-toolkit/compat'
import ky from 'ky'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { logger } from '@/lib/logger'
import {
  consumeOrganisationSwitchNotice,
  navigateAfterOrganisationSwitch,
} from '@/lib/organisation-switch-target'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { Organisation } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

// Payload does not re-export the option type of its `Select`, so it is restated here. The same
// shape lives in src/plugins/deeplTranslate/client/components/modals/language-selectors.tsx.
type Option<TValue> = {
  [p: string]: unknown
  id?: string
  value: TValue
}

const ORG_LANGUAGE_MISMATCH_TOAST = 'org-language-mismatch'
// The matching rules live in src/app/(payload)/custom.scss.
const ORG_LANGUAGE_MISMATCH_ITEM = 'org-language-toast'
const ORG_LANGUAGE_MISMATCH_ACTION = 'org-language-toast__action'

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

  const applyLanguagePreference = useCallback(
    async (org?: Organisation) => {
      const language = org?.organisationLanguage ?? defaultLocale
      if (!language) return
      await setPreference('locale', language)

      // Remove the locale parameter from the URL if it exists
      if (paramsLocale) {
        const url = new URL(window.location.href)
        url.searchParams.delete('locale')
        window.history.replaceState({}, '', url)
      }
    },
    [defaultLocale, paramsLocale, setPreference],
  )

  // A language reset keeps the current page. Only an organisation switch redirects.
  const resetLanguagePreference = useCallback(
    async (org?: Organisation) => {
      await applyLanguagePreference(org)
      window.location.reload()
    },
    [applyLanguagePreference],
  )

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

  // A toast call inside a mount effect is dropped, because Payload mounts its toast container
  // above this component. A zero delay defers the call until every mount effect has run.
  // The id keeps a re-render from stacking a second copy of the same notice.
  useEffect(() => {
    if (!orgLangMismatch) return

    const timer = setTimeout(() => {
      toast(t('admin:selectOrganisations:orgLanguageMismatch'), {
        action: {
          label: t('admin:selectOrganisations:reset'),
          onClick: () => void resetLanguagePreference(selectedOrg),
        },
        // Payload renders every toast unstyled, so sonner draws no button at all. The first class
        // carries Payload's pill look. The second moves the button below the message, because a
        // German sentence beside it leaves the text about 130px wide.
        classNames: {
          actionButton: ORG_LANGUAGE_MISMATCH_ACTION,
          toast: ORG_LANGUAGE_MISMATCH_ITEM,
        },
        // The notice stays until the user acts on it or dismisses it.
        duration: Infinity,
        id: ORG_LANGUAGE_MISMATCH_TOAST,
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [orgLangMismatch, resetLanguagePreference, selectedOrg, t])

  const onChange = async (option: Option<unknown> | Option<unknown>[]) => {
    // The select is single and never clearable, so the array form and the empty value never
    // reach this handler. Both are guarded because the prop type admits them.
    if (Array.isArray(option) || !option.value) {
      return
    }

    const selectedId = toNumber(option.value)

    // The server rejects an organisation the user does not belong to. Without this catch the
    // rejection is unhandled, and the dropdown snaps back with no message.
    try {
      await ky.patch(`/api/users/${userId}`, {
        credentials: 'include',
        json: {
          selectedOrganisation: selectedId,
        },
      })
    } catch (error) {
      logger.error('Failed to switch the organisation', { error })
      // Payload's toast default is 4000 ms. A denial needs longer, because the user must
      // read it and then pick another organisation.
      toast.error(t('error:notAllowedToPerformAction'), { duration: 12_000 })
      return
    }

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
    <Select
      isClearable={false}
      isCreatable={false}
      onChange={onChange}
      options={options}
      value={selectedOption}
    />
  )
}
