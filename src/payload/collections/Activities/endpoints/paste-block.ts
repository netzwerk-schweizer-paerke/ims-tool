import type { Endpoint, PayloadRequest, TypedLocale } from 'payload'

import { z } from 'zod'

import type { CloneEndpointConfig } from '@/payload/utilities/cloning/create-clone-endpoint'

import { toContentLocale } from '@/lib/locale-utils'
import { Activity } from '@/payload-types'
import { remapActivityTaskRelations } from '@/payload/collections/Activities/endpoints/clone/utils/clone-activity-blocks'
import { findBlockIndex, type StoredBlock } from '@/payload/utilities/cloning/block-position'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales, hasLocaleContent } from '@/payload/utilities/cloning/clone-locales'
import { scanActivityForDocumentIds } from '@/payload/utilities/cloning/document-scanner'
import { insertBlock } from '@/payload/utilities/cloning/insert-block'
import { lockActivityForPaste } from '@/payload/utilities/cloning/lock-activity'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import { runClonePipeline } from '@/payload/utilities/cloning/run-clone-pipeline'
import { scanNestedTaskDocumentIds } from '@/payload/utilities/cloning/scan-nested-task-documents'
import { stripBlocks } from '@/payload/utilities/cloning/strip-blocks'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

type ActivityBlock = NonNullable<Activity['blocks']>[number]

/** The source block in each locale that holds one at its position. */
type BlockSource = Map<TypedLocale, ActivityBlock>

const bodySchema = z.object({
  locale: z.string(),
  mode: z.enum(['copy', 'link']).default('copy'),
  source: z.object({ activityId: z.number().min(1), blockId: z.string().min(1) }),
  targetActivityId: z.number().min(1),
})

/**
 * The pipeline config of one block paste. The source block and the target Thema come from the
 * request, so the config is built per request.
 */
const pasteBlockConfig = (
  blockId: string,
  targetActivityId: number,
): CloneEndpointConfig<BlockSource> => ({
  cloneSource: async ({ cloneLocales, documentPreloader, req, source, targetOrgId, tracker }) => {
    let written = 0
    let name = ''

    // The source block of the first locale that has one. A target locale without its own source
    // block gets this one, so every locale of the Thema gains a block at the same position.
    // Locales resolve a block by position, and a gap in one locale would shift every later block.
    const fallbackBlock = source.values().next().value

    if (!fallbackBlock) {
      throw new CloneHttpError('The Prozessgruppe exists in no language', 404)
    }

    await lockActivityForPaste(req, targetActivityId)

    for (const locale of cloneLocales) {
      const block = source.get(locale) ?? fallbackBlock

      const target = await req.payload.findByID({
        collection: 'activities',
        depth: 0,
        fallbackLocale: false,
        id: targetActivityId,
        locale,
        overrideAccess: true,
        req,
      })

      // A Thema with no content in this locale renders no blocks there. A block written into it
      // would be invisible, and it would add a locale the Thema never had.
      if (!hasLocaleContent(target)) {
        continue
      }

      const [stripped] = await stripBlocks([block], req, targetOrgId, locale, documentPreloader, tracker)
      const [prepared] =
        (await remapActivityTaskRelations({
          blocks: [stripped as ActivityBlock],
          documentPreloader,
          locales: cloneLocales,
          req,
          targetOrgId,
          tracker,
        })) ?? []

      await req.payload.update({
        collection: 'activities',
        data: { blocks: insertBlock(target.blocks ?? [], prepared) },
        depth: 0,
        id: targetActivityId,
        locale,
        overrideAccess: true,
        req: mergeReqContextTargetOrgId(req, targetOrgId),
      })

      if (written === 0) {
        tracker.addSourceBlock()
        tracker.addClonedBlock()
        name = block.graph?.task?.text ?? ''
      }

      written += 1
    }

    if (written === 0) {
      throw new CloneHttpError('The target Thema has no content in any language', 400)
    }

    return { id: targetActivityId, name }
  },
  collectionSlug: 'activities',
  collectNestedDocumentIds: ({ cloneLocales, req, sources }) =>
    scanNestedTaskDocumentIds(
      req,
      sources.flatMap((byLocale) => Array.from(byLocale.values(), (block) => ({ blocks: [block] }))),
      cloneLocales,
    ),
  label: { plural: 'Prozessgruppen', singular: 'Prozessgruppe' },
  readSource: async ({ cloneLocales, req, sourceId }) => {
    const index = await findSourceBlockIndex(req, sourceId, blockId)
    const source: BlockSource = new Map()
    const documentIds: number[] = []

    for (const locale of cloneLocales) {
      const activity = await req.payload.findByID({
        collection: 'activities',
        depth: 2,
        fallbackLocale: false,
        id: sourceId,
        locale,
        req,
      })
      const block = activity.blocks?.[index]

      if (!block) {
        continue
      }

      // An input/output block belongs to the Thema it frames. Only a Prozessgruppe moves alone.
      if (block.blockType !== 'activity-task') {
        throw new CloneHttpError('Only a Prozessgruppe can be pasted into a Thema', 400)
      }

      source.set(locale, block)
      documentIds.push(...scanActivityForDocumentIds({ blocks: [block] }))
    }

    const name = source.values().find((block) => block.graph?.task?.text)?.graph?.task?.text

    return { documentIds, name: name ?? '', source }
  },
  stampsCloneSource: false,
})

const findSourceBlockIndex = async (
  req: PayloadRequest,
  activityId: number,
  blockId: string,
): Promise<number> => {
  const activity = await req.payload.findByID({
    collection: 'activities',
    depth: 0,
    id: activityId,
    locale: 'all',
    overrideAccess: true,
    req,
    select: { blocks: true },
  })
  const index = findBlockIndex(
    (activity.blocks ?? {}) as unknown as Record<string, null | StoredBlock[]>,
    blockId,
  )

  if (index === -1) {
    throw new CloneHttpError(`Source block ${blockId} not found`, 404)
  }

  return index
}

/**
 * `POST /api/activities/paste-block` — pastes one Prozessgruppe at the end of a Thema, before a
 * closing input/output block (PIMS-83). It runs the shared clone pipeline: the same access
 * check, the same two phases and the same cleanup as a clone.
 */
export const pasteBlockEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)

    const parsed = bodySchema.safeParse(req.json ? await req.json() : {})

    if (!parsed.success) {
      return Response.json(formatValidationErrors(parsed.error), { status: 400 })
    }

    const { locale: requestedLocale, mode, source, targetActivityId } = parsed.data
    const locale = toContentLocale(requestedLocale, req.payload.config)

    if (!locale) {
      return Response.json({ error: 'Unsupported locale' }, { status: 400 })
    }

    // The target park comes from the target Thema, never from the request.
    const target = await req.payload.findByID({
      collection: 'activities',
      depth: 0,
      disableErrors: true,
      id: targetActivityId,
      overrideAccess: true,
      req,
      select: { organisation: true },
    })
    const targetOrganisationId = getIdFromRelation(target?.organisation)

    if (!target || targetOrganisationId === null) {
      return Response.json({ error: 'Target Thema not found' }, { status: 404 })
    }

    const { body, status } = await runClonePipeline(
      pasteBlockConfig(source.blockId, targetActivityId),
      {
        cloneLocales: getCloneLocales(req.payload.config),
        locale,
        mode,
        req,
        sourceIds: [source.activityId],
        targetOrganisationId,
        user: req.user,
      },
    )

    return Response.json(body, { status })
  },
  method: 'post',
  path: '/paste-block',
}
