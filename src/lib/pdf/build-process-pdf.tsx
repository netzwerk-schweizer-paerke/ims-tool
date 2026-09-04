import type { Payload, TypedLocale } from 'payload'

import { renderToBuffer } from '@react-pdf/renderer'
import { format, isValid, parseISO } from 'date-fns'
import React from 'react'

import { disableHyphenation } from '@/components/pdf/hyphenation'
import { pdfCatalogue } from '@/components/pdf/lib/pdf-labels'
import { ProcessDocument, sectionTitle } from '@/components/pdf/process-document'
import { PdfDocumentData, PdfSection } from '@/components/pdf/sections'
import { ADMIN_DATE_FORMAT } from '@/config/date-format'
import { logger } from '@/lib/logger'
import { pdfFilename } from '@/lib/pdf/pdf-filename'
import { ShareTarget } from '@/lib/share-link-target'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { loadActivityBlock } from '@/payload/utilities/share/load-activity-block'
import { loadFlow } from '@/payload/utilities/share/load-flow'
import { loadLandscape } from '@/payload/utilities/share/load-landscape'
import { loadList } from '@/payload/utilities/share/load-list'

export type BuildProcessPdfArgs = {
  /** True adds every page under the target. False renders the target alone. */
  deep: boolean
  /** Builds the live URL of one section, which the QR code carries. */
  hrefFor: (section: PdfSection) => null | string
  locale?: TypedLocale
  localeCode: string
  organisationId: number
  organisationName: string
  payload: Payload
  target: ShareTarget
}

const formatStamp = (value: null | string | undefined): null | string => {
  if (!value) {
    return null
  }

  const parsed = parseISO(value)

  return isValid(parsed) ? format(parsed, ADMIN_DATE_FORMAT) : null
}

/** The newest change across the park's activities. The landscape spans them all. */
const newestUpdate = (timestamps: (null | string | undefined)[]): null | string => {
  const valid = timestamps.filter((value): value is string => Boolean(value)).sort()

  return valid.at(-1) ?? null
}

type LoaderArgs = { locale?: TypedLocale; organisationId: number; payload: Payload }

/**
 * Every page under the landscape: each activity block, then the flows and lists it references.
 *
 * A relation is populated at depth 2, so the walk reads the ids from the loaded activity rather
 * than issuing another query per block.
 */
const landscapeChildren = async (
  args: LoaderArgs,
  activities: { blocks?: unknown; id: number }[],
): Promise<PdfSection[]> => {
  const sections: PdfSection[] = []
  const seenFlows = new Set<number>()
  const seenLists = new Set<number>()

  for (const activity of activities) {
    const blocks = Array.isArray(activity.blocks) ? activity.blocks : []

    for (const block of blocks) {
      const typed = block as {
        id?: null | string
        relations?: { tasks?: { relationTo: string; value: unknown }[] }
      }

      if (typed.id) {
        const loaded = await loadActivityBlock({
          ...args,
          activityId: activity.id,
          blockId: typed.id,
        })

        if (loaded) {
          sections.push({
            activity: loaded.activity,
            activityBlock: loaded.activityBlock,
            kind: 'activityBlock',
          })
        }
      }

      for (const task of typed.relations?.tasks ?? []) {
        const id = getIdFromRelation(task.value)
        if (id === null) continue

        if (task.relationTo === 'task-flows' && !seenFlows.has(id)) {
          seenFlows.add(id)
          const flow = await loadFlow({ ...args, flowId: id })
          if (flow) sections.push({ flow: flow.flowBlock, kind: 'flow' })
        }

        if (task.relationTo === 'task-lists' && !seenLists.has(id)) {
          seenLists.add(id)
          const list = await loadList({ ...args, listId: id })
          if (list) sections.push({ kind: 'list', list: list.listBlock })
        }
      }
    }
  }

  return sections
}

const collectSections = async (
  args: BuildProcessPdfArgs,
  loaderArgs: LoaderArgs,
  landscapeTitle: string,
): Promise<PdfSection[]> => {
  const { deep, target } = args

  if (target.targetType === 'flow') {
    const loaded = await loadFlow({ ...loaderArgs, flowId: target.taskFlow })
    return loaded ? [{ flow: loaded.flowBlock, kind: 'flow' }] : []
  }

  if (target.targetType === 'list') {
    const loaded = await loadList({ ...loaderArgs, listId: target.taskList })
    return loaded ? [{ kind: 'list', list: loaded.listBlock }] : []
  }

  if (target.targetType === 'activityBlock') {
    const loaded = await loadActivityBlock({
      ...loaderArgs,
      activityId: target.activity,
      blockId: target.blockId,
    })

    if (!loaded) {
      return []
    }

    const own: PdfSection = {
      activity: loaded.activity,
      activityBlock: loaded.activityBlock,
      kind: 'activityBlock',
    }

    if (!deep) {
      return [own]
    }

    const children = await landscapeChildren(loaderArgs, [
      { blocks: loaded.activityBlock ? [loaded.activityBlock] : [], id: loaded.activity.id },
    ])

    // The block's own page already leads, so drop the duplicate the walk produces.
    return [own, ...children.filter((section) => section.kind !== 'activityBlock')]
  }

  const landscape = await loadLandscape(loaderArgs)
  const activities = [
    ...landscape.strategicActivities,
    ...landscape.standardActivities,
    ...landscape.supportActivities,
  ]

  const first: PdfSection = {
    kind: 'landscape',
    landscape,
    title: landscapeTitle,
    updatedAt: newestUpdate(activities.map((activity) => activity.updatedAt)),
  }

  return deep ? [first, ...(await landscapeChildren(loaderArgs, activities))] : [first]
}

/**
 * Renders the process document as a PDF buffer.
 *
 * The loaders are the same ones the screen uses, so the document and the screen never disagree.
 * The caller resolves the organisation, never the request.
 */
export const buildProcessPdf = async (
  args: BuildProcessPdfArgs,
): Promise<{ buffer: Buffer; filename: string }> => {
  disableHyphenation()

  const catalogue = pdfCatalogue(args.localeCode)
  const loaderArgs: LoaderArgs = {
    locale: args.locale,
    organisationId: args.organisationId,
    payload: args.payload,
  }

  const landscapeTitle = catalogue.activityLandscape.title
  const sections = await collectSections(args, loaderArgs, landscapeTitle)
  const producedAt = new Date()

  logger.info(
    `pdf/build: organisation=${args.organisationId} sections=${sections.length} deep=${args.deep}`,
  )

  const data: PdfDocumentData = {
    locale: args.localeCode,
    organisationName: args.organisationName,
    producedAt: producedAt.toISOString(),
    producedAtLabel: format(producedAt, ADMIN_DATE_FORMAT),
    sections,
    title: landscapeTitle,
  }

  const buffer = await renderToBuffer(
    <ProcessDocument
      catalogue={catalogue}
      data={data}
      formatDate={formatStamp}
      hrefFor={args.hrefFor}
    />,
  )

  return {
    buffer,
    filename: pdfFilename({
      deep: args.deep,
      deepLabel: catalogue.pdf.filenameAll,
      organisationName: args.organisationName,
      producedAt,
      title: sections[0] ? sectionTitle(sections[0]) : landscapeTitle,
    }),
  }
}
