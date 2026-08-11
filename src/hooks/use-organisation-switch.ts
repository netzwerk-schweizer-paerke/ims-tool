'use client'

import { usePreferences } from '@payloadcms/ui'
import ky from 'ky'
import { useState } from 'react'

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

      // Update language preference if the target org has a language set
      if (targetOrg?.organisationLanguage) {
        await setPreference('locale', targetOrg.organisationLanguage)
      }

      // Remove locale parameter from URL if it exists
      const url = new URL(window.location.href)
      if (url.searchParams.has('locale')) {
        url.searchParams.delete('locale')
        window.history.replaceState({}, '', url)
      }

      // Reload to apply the new organisation context
      window.location.reload()
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
