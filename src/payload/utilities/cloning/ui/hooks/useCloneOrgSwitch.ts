import { useAuth, useLocale } from '@payloadcms/ui'
import { useOrganisationSwitch } from '@/hooks/useOrganisationSwitch'
import { TargetOrganisation, UseCloneOrgSwitchResult } from './types'

/**
 * Organization switching functionality wrapping useOrganisationSwitch
 */
export function useCloneOrgSwitch(
  targetOrgId: number | null,
  targetOrganisations: TargetOrganisation[],
): UseCloneOrgSwitchResult {
  const { user } = useAuth()
  const locale = useLocale()
  const { switchOrganisation, isSwitching } = useOrganisationSwitch()

  const handleOrgSwitch = async () => {
    if (!user?.id || !targetOrgId) return

    try {
      // Find the target organization object
      const targetOrg = targetOrganisations.find((org) => org.value === targetOrgId)

      // Use the hook to switch organization - this will reload the page
      await switchOrganisation(
        typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
        targetOrgId,
        targetOrg
          ? ({
              id: targetOrg.value,
              name: targetOrg.label,
              organisationLanguage: locale?.code,
            } as any)
          : undefined,
      )
    } catch (error) {
      console.error('Failed to switch organization:', error)
      throw error
    }
  }

  return {
    handleOrgSwitch,
    isSwitching,
  }
}
