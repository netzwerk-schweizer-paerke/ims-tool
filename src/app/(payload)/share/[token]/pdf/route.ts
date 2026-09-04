import config from '@payload-config'
import { getPayload } from 'payload'

import { PdfSection } from '@/components/pdf/sections'
import { shareViewLinks } from '@/components/views/view-links'
import { isLocalDevelopment } from '@/lib/environment'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { logger } from '@/lib/logger'
import { buildProcessPdf } from '@/lib/pdf/build-process-pdf'
import { parseViewQuery, resolveRequestedTarget } from '@/lib/share-scope'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** The path of one section under a share token, so a QR code reaches the live page. */
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
      return ''
    }
    case 'list': {
      return `/list/${section.list.id}`
    }
  }
}

/**
 * The PDF behind a share link.
 *
 * The static `pdf` segment takes priority over the sibling `[[...view]]` page, so this route needs
 * no change to the page. `?view=flow/817` picks a sub page, and `?deep=1` adds every page under it.
 */
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> => {
  const { token } = await params
  const query = new URL(request.url).searchParams

  if (!token) {
    return new Response('Not found', { status: 404 })
  }

  const payload = await getPayload({ config })

  // The visitor holds a token and no session, so the read overrides access. The token never
  // reaches a log line.
  const link = await payload
    .find({
      collection: 'share-links',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { token: { equals: token } },
    })
    .then((res) => res.docs[0] ?? null)

  if (!link) {
    return new Response('Not found', { status: 404 })
  }

  const organisationId = getIdFromRelation(link.organisation)
  const target = resolveRequestedTarget(link, parseViewQuery(query.get('view')))

  if (organisationId === null || !target) {
    return new Response('Not found', { status: 404 })
  }

  const requested = query.get('locale') ?? link.locale
  const locale = toContentLocale(requested, payload.config)
  const localeCode = locale ?? getDefaultLocaleCode(payload.config)

  const organisation = await payload
    .find({
      collection: 'organisations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { id: { equals: organisationId } },
    })
    .then((res) => res.docs[0] ?? null)

  const origin = new URL(request.url).origin
  const links = shareViewLinks(token)

  try {
    const { buffer, filename } = await buildProcessPdf({
      deep: query.get('deep') === '1',
      hrefFor: (section) => {
        const path = sectionPath(section)
        return path === null
          ? null
          : `${origin}${links.basePath}${path}?locale=${encodeURIComponent(localeCode)}`
      },
      locale,
      localeCode,
      organisationId,
      organisationName: organisation?.name ?? '',
      payload,
      target,
    })

    // `?inline=1` opens the document in the browser viewer. The default downloads it.
    const disposition = query.get('inline') === '1' ? 'inline' : 'attachment'

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Content-Type': 'application/pdf',
        // A share link must never reach a search index, and neither must its export.
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    logger.error('share/pdf: the document could not be rendered', error)

    // Local development shows the cause in the response, because the renderer fails deep inside
    // the PDF tree and the browser is the only place a developer sees this route's output.
    const detail = isLocalDevelopment && error instanceof Error ? `: ${error.stack ?? error.message}` : ''

    return new Response(`The document could not be rendered${detail}`, { status: 500 })
  }
}
