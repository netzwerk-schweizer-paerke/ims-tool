export const ORGANISATION_SWITCH_NOTICE_KEY = 'ims:organisation-switch-notice'

/**
 * Returns the path to open after an organisation switch, or null when the current path stays
 * valid. Read access filters every document by the selected organisation, so a reload on a
 * document of the previous organisation answers "document not found".
 */
export const organisationSwitchTarget = (pathname: string): null | string => {
  const collection = /^\/admin\/collections\/([^/]+)\/(.+)$/.exec(pathname)

  if (collection) {
    const [, slug, rest] = collection
    // The create form holds no organisation yet, so it survives the switch.
    return rest === 'create' ? null : `/admin/collections/${slug}`
  }

  // The block views carry a document id and have no organisation-safe parent.
  if (/^\/admin\/(flow|list)\/[^/]+/.test(pathname)) return '/admin'
  if (/^\/admin\/activity\/[^/]+\/block\//.test(pathname)) return '/admin'

  return null
}

export const navigateAfterOrganisationSwitch = () => {
  const target = organisationSwitchTarget(window.location.pathname)

  if (target === null) {
    window.location.reload()
    return
  }

  try {
    window.sessionStorage.setItem(ORGANISATION_SWITCH_NOTICE_KEY, String(Date.now()))
  } catch {
    // The notice is optional. A failed write must not stop the redirect.
  }

  // Replace, so the Back button does not return to the unreadable document.
  window.location.replace(target)
}

/** A cancelled navigation leaves the flag behind, so an old flag never shows a notice. */
const NOTICE_MAX_AGE_MS = 10_000

export const consumeOrganisationSwitchNotice = (): boolean => {
  try {
    const written = window.sessionStorage.getItem(ORGANISATION_SWITCH_NOTICE_KEY)
    if (written === null) return false
    window.sessionStorage.removeItem(ORGANISATION_SWITCH_NOTICE_KEY)
    return Date.now() - Number(written) < NOTICE_MAX_AGE_MS
  } catch {
    return false
  }
}
