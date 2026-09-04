/**
 * How a read-only view builds its links.
 *
 * The admin view routes to `/admin`. A public share page routes to its own token, so a visitor
 * with no account can open the pages the link covers.
 */
export type ViewLinks = {
  /** The prefix of a view route, with no trailing slash. */
  basePath: string
  /** The admin shows the edit link. A public page shows none, because the visitor cannot edit. */
  showEdit: boolean
}

export const ADMIN_VIEW_LINKS: ViewLinks = { basePath: '/admin', showEdit: true }

/** A share page routes every link back through its own token, so navigation stays public. */
export const shareViewLinks = (token: string): ViewLinks => ({
  basePath: `/share/${encodeURIComponent(token)}`,
  showEdit: false,
})
