'use client'

import { useState } from 'react'
import ky from 'ky'
import { usePreferences } from '@payloadcms/ui'
import { Organisation } from '@/payload-types'

type UseOrganisationSwitchResult = {
  switchOrganisation: (userId: number, targetOrgId: number, targetOrg?: Organisation) => Promise<void>
  isSwitching: boolean
  error: string | null
}

/**
 * Custom hook for switching user's selected organization
 * Handles both the API call to update the user and the language preference update
 */
export function useOrganisationSwitch(): UseOrganisationSwitchResult {
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setPreference } = usePreferences()

  const switchOrganisation = async (
    userId: number,
    targetOrgId: number,
    targetOrg?: Organisation
  ) => {
    setIsSwitching(true)
    setError(null)

    try {
      // Update the user's selected organisation
      await ky.patch(`/api/users/${userId}`, {
        json: {
          selectedOrganisation: targetOrgId,
        },
        credentials: 'include',
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organisation'
      setError(errorMessage)
      setIsSwitching(false)
      throw err
    }
  }

  return {
    switchOrganisation,
    isSwitching,
    error,
  }
}