/**
 * How a read-only view builds its links.
 *
 * The admin view routes to `/admin`. A public share page routes to its own token, so a visitor
 * with no account can open the pages the link covers.
 */
export type ViewLinks = {
  /** The prefix of a view route, with no trailing slash. */
  basePath: string
  /**
   * The viewer may copy and paste (PIMS-83). The server resolves it from the role, because a
   * client component cannot read the role helpers. A share page never sets it.
   */
  canCopy?: boolean
  /** The park the view shows. A copy remembers it, and a paste compares against it. */
  organisationId?: null | number
  /** The admin shows the edit link. A public page shows none, because the visitor cannot edit. */
  showEdit: boolean
}

export const ADMIN_VIEW_LINKS: ViewLinks = { basePath: '/admin', showEdit: true }

/** The links of one admin view, with the copy permission the server resolved for the viewer. */
export const adminViewLinks = (canCopy: boolean, organisationId: null | number): ViewLinks => ({
  ...ADMIN_VIEW_LINKS,
  canCopy: canCopy && organisationId !== null,
  organisationId,
})

/** A share page routes every link back through its own token, so navigation stays public. */
export const shareViewLinks = (token: string): ViewLinks => ({
  basePath: `/share/${encodeURIComponent(token)}`,
  showEdit: false,
})
