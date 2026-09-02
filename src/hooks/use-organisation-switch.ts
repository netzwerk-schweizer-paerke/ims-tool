'use client'

import { usePreferences } from '@payloadcms/ui'
import ky from 'ky'
import { useState } from 'react'

import { navigateAfterOrganisationSwitch } from '@/lib/organisation-switch-target'
import { Organisation } from '@/payload-types'

type UseOrganisationSwitchResult = {
  error: null | string
  isSwitching: boolean
  switchOrganisation: (
    userId: number,
    targetOrgId: number,
    targetOrg?: Organisation,
  ) => Promise<void>
}

/**
 * Custom hook for switching user's selected organization
 * Handles both the API call to update the user and the language preference update
 */
export function useOrganisationSwitch(): UseOrganisationSwitchResult {
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const { setPreference } = usePreferences()

  const switchOrganisation = async (
    userId: number,
    targetOrgId: number,
    targetOrg?: Organisation,
  ) => {
    setIsSwitching(true)
    setError(null)

    try {
      // Update the user's selected organisation
      await ky.patch(`/api/users/${userId}`, {
        credentials: 'include',
        json: {
          selectedOrganisation: targetOrgId,
        },
      })

      // The organisation changed above. Everything after it must not abort the redirect, because
      // the caller then stays on a document that the new organisation cannot read.
      if (targetOrg?.organisationLanguage) {
        try {
          await setPreference('locale', targetOrg.organisationLanguage)
        } catch (preferenceError) {
          console.error('Failed to set the locale preference after the switch:', preferenceError)
        }
      }

      // Remove locale parameter from URL if it exists
      const url = new URL(window.location.href)
      if (url.searchParams.has('locale')) {
        url.searchParams.delete('locale')
        window.history.replaceState({}, '', url)
      }

      // Apply the new organisation context. A document of the previous organisation is
      // unreadable now, so the helper leaves that page instead of reloading it.
      navigateAfterOrganisationSwitch()
    } catch (error_) {
      const errorMessage = error_ instanceof Error ? error_.message : 'Failed to switch organisation'
      setError(errorMessage)
      setIsSwitching(false)
      throw error_
    }
  }

  return {
    error,
    isSwitching,
    switchOrganisation,
  }
}
