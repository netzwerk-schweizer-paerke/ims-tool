import { Endpoint } from 'payload'

import { PdfSection } from '@/components/pdf/sections'
import { ADMIN_VIEW_LINKS } from '@/components/views/view-links'
import { isLocalDevelopment } from '@/lib/environment'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { logger } from '@/lib/logger'
import { buildProcessPdf } from '@/lib/pdf/build-process-pdf'
import { ShareTarget } from '@/lib/share-link-target'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** The admin path of one section, which the QR code carries for a signed-in reader. */
const sectionPath = (section: PdfSection): null | string => {
  switch (section.kind) {
    case 'activityBlock': {
      return section.activityBlock?.id
        ? `/activity/${section.activity.id}/block/${section.activityBlock.id}`
        : null
    }
    case 'flow': {
      return `/flow/${section.flow.id}`
    }
    case 'landscape': {
      return '/activities'
    }
    case 'list': {
      return `/list/${section.list.id}`
    }
  }
}

const readTarget = (query: URLSearchParams): null | ShareTarget => {
  const number = (key: string) => {
    const parsed = Number(query.get(key))
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  switch (query.get('target')) {
    case 'activityBlock': {
      const activity = number('activity')
      const blockId = query.get('block')
      return activity && blockId ? { activity, blockId, targetType: 'activityBlock' } : null
    }
    case 'flow': {
      const taskFlow = number('flow')
      return taskFlow ? { targetType: 'flow', taskFlow } : null
    }
    case 'landscape': {
      return { targetType: 'activityLandscape' }
    }
    case 'list': {
      const taskList = number('list')
      return taskList ? { targetType: 'list', taskList } : null
    }
    default: {
      return null
    }
  }
}

/**
 * The PDF for a signed-in user.
 *
 * The organisation comes from the session, never from the query, so this endpoint cannot export
 * another park. The share route is the public twin and resolves the park from its token instead.
 */
export const processPdfEndpoint: Endpoint = {
  handler: async (req) => {
    const user = req.user

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const organisationId = getIdFromRelation(user.selectedOrganisation)

    if (organisationId === null) {
      return Response.json({ error: 'No organisation selected' }, { status: 400 })
    }

    // The stored selection alone never proves membership, because its owner can write it.
    const member =
      checkUserRoles([ROLE_SUPER_ADMIN], user) ||
      checkOrganisationRoles([ROLE_SUPER_ADMIN, ROLE_USER], user, organisationId)

    if (!member) {
      return Response.json({ error: 'Not a member of the selected organisation' }, { status: 403 })
    }

    const query = new URL(req.url ?? '', 'http://localhost').searchParams
    const target = readTarget(query)

    if (!target) {
      return Response.json({ error: 'Unknown export target' }, { status: 400 })
    }

    const locale = toContentLocale(req.locale, req.payload.config)
    const localeCode = locale ?? getDefaultLocaleCode(req.payload.config)

    const organisation = await req.payload.findByID({
      collection: 'organisations',
      depth: 0,
      id: organisationId,
      overrideAccess: true,
      req,
    })

    // A top-level navigation sends no `Origin` header, and the QR code then carried a bare path.
    // Payload fills `req.origin` from the request URL, which the share route reads the same way.
    const origin = req.origin

    try {
      const { buffer, filename } = await buildProcessPdf({
        deep: query.get('deep') === '1',
        hrefFor: (section) => {
          const path = sectionPath(section)
          return path === null
            ? null
            : `${origin}${ADMIN_VIEW_LINKS.basePath}${path}?locale=${encodeURIComponent(localeCode)}`
        },
        locale,
        localeCode,
        organisationId,
        organisationName: organisation?.name ?? '',
        payload: req.payload,
        target,
      })

      const disposition = query.get('inline') === '1' ? 'inline' : 'attachment'

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Disposition': `${disposition}; filename="${filename}"`,
          'Content-Type': 'application/pdf',
        },
      })
    } catch (error) {
      logger.error('endpoints/process-pdf: the document could not be rendered', error)

      // Local development returns the cause, because the renderer fails deep inside the PDF tree.
      const detail = isLocalDevelopment && error instanceof Error ? error.stack : undefined

      return Response.json(
        { detail, error: 'The document could not be rendered' },
        { status: 500 },
      )
    }
  },
  method: 'get',
  path: '/process-pdf',
}
