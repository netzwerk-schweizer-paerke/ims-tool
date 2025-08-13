// New function to handle relationship translations
import type { PayloadRequest, TypedLocale } from 'payload'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { translateOperation } from '@/plugins/deeplTranslate'

// Helper function to extract ID from polymorphic relationships
function extractIdFromPolymorphicRelation(relation: any): string | number | null {
  // Handle polymorphic relationships: { relationTo: "collection", value: { id: 123, ... } }
  if (relation && typeof relation === 'object' && 'relationTo' in relation && 'value' in relation) {
    const value = relation.value
    if (value && typeof value === 'object' && 'id' in value) {
      return value.id as string | number
    }
  }
  // Fall back to standard extraction
  return getIdFromRelation(relation)
}

export async function translateRelationships(args: {
  doc: Record<string, any>
  fields: any[]
  fromLocale: TypedLocale
  toLocale: TypedLocale
  depth: number
  req: PayloadRequest
  overrideAccess?: boolean
}) {
  const { doc, fields, fromLocale, toLocale, depth, req, overrideAccess } = args

  console.log('Starting relationship translation with depth:', depth)
  console.log('Document keys:', Object.keys(doc).slice(0, 10))
  console.log('Number of fields to check:', fields.length)

  if (depth <= 0) {
    console.log('Depth is 0, stopping relationship traversal')
    return
  }

  const processedIds = new Set<string>()

  for (const field of fields) {
    if (field.type === 'relationship' && doc[field.name]) {
      console.log(`Found relationship field: ${field.name}`)
      const relationValue = doc[field.name]
      console.log(`  Value type: ${typeof relationValue}`)
      console.log(`  Value (first 200 chars): ${JSON.stringify(relationValue).substring(0, 200)}`)
      const relationTo = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]
      console.log(`  Relation targets: ${relationTo.join(', ')}`)

      // Handle single or multiple relationships
      const relations = Array.isArray(relationValue) ? relationValue : [relationValue]
      console.log(`Number of relations to process: ${relations.length}`)

      for (const relation of relations) {
        if (!relation) continue

        console.log(
          'Processing relation:',
          typeof relation === 'object' ? JSON.stringify(relation).substring(0, 100) : relation,
        )

        // Extract ID from relation - handle polymorphic relationships
        const relationId = extractIdFromPolymorphicRelation(relation)
        if (!relationId) {
          console.log('Could not extract ID from relation')
          continue
        }
        console.log(`Extracted relation ID: ${relationId}`)

        // Determine collection - for polymorphic relationships, check if relation has relationTo
        const relationCollection =
          typeof relation === 'object' && 'relationTo' in relation
            ? (relation as any).relationTo
            : relationTo[0]

        if (!relationCollection) {
          console.log('Could not determine collection')
          continue
        }
        console.log(`Relation collection: ${relationCollection}`)

        // Only translate task-lists and task-flows relationships
        if (relationCollection !== 'task-lists' && relationCollection !== 'task-flows') {
          console.log(`Skipping relationship to collection: ${relationCollection}`)
          continue
        }

        // Skip if already processed (avoid circular references)
        const key = `${relationCollection}-${relationId}`
        if (processedIds.has(key)) continue
        processedIds.add(key)

        try {
          console.log(`Calling translateOperation for ${relationCollection}/${relationId}`)
          // Recursively translate the related document
          await translateOperation({
            id: relationId,
            collectionSlug: relationCollection as any,
            locale: toLocale,
            localeFrom: fromLocale,
            overrideAccess,
            req,
            update: true,
            emptyOnly: false,
            includeRelationships: true,
            relationshipDepth: depth - 1,
          })

          console.log(`✅ Translated relationship: ${relationCollection}/${relationId}`)
        } catch (error) {
          console.error(
            `❌ Failed to translate relationship ${relationCollection}/${relationId}:`,
            error,
          )
        }
      }
    }

    // Handle nested fields in groups
    if (field.type === 'group' && field.fields && doc[field.name]) {
      console.log(`Found group field: ${field.name}`)
      await translateRelationships({
        doc: doc[field.name],
        fields: field.fields,
        fromLocale,
        toLocale,
        depth,
        req,
        overrideAccess,
      })
    }

    // Handle row fields - these contain nested fields
    if (field.type === 'row' && field.fields) {
      console.log(`Found row field, processing ${field.fields.length} nested fields`)
      await translateRelationships({
        doc: doc,
        fields: field.fields,
        fromLocale,
        toLocale,
        depth,
        req,
        overrideAccess,
      })
    }

    // Handle tabs fields - these contain tabs with nested fields
    if (field.type === 'tabs' && field.tabs) {
      console.log(`Found tabs field with ${field.tabs.length} tabs`)
      for (const tab of field.tabs) {
        if (tab.fields && doc[tab.name]) {
          console.log(`  Processing tab: ${tab.name}`)
          await translateRelationships({
            doc: doc[tab.name],
            fields: tab.fields,
            fromLocale,
            toLocale,
            depth,
            req,
            overrideAccess,
          })
        }
      }
    }

    // Handle blocks - each block can have different fields
    if (field.type === 'blocks' && doc[field.name]) {
      console.log(`Found blocks field: ${field.name}`)
      const blocks = doc[field.name]
      if (Array.isArray(blocks)) {
        console.log(`  Processing ${blocks.length} blocks`)
        for (const block of blocks) {
          if (!block || !block.blockType) continue
          console.log(`  Block type: ${block.blockType}`)

          // Find the block definition
          const blockDef = field.blocks.find((b: any) => b.slug === block.blockType)
          if (blockDef && blockDef.fields) {
            console.log(`  Block has ${blockDef.fields.length} fields`)
            await translateRelationships({
              doc: block,
              fields: blockDef.fields,
              fromLocale,
              toLocale,
              depth,
              req,
              overrideAccess,
            })
          }
        }
      }
    }

    // Handle arrays - all items have the same fields
    if (field.type === 'array' && field.fields && doc[field.name]) {
      const arrayItems = doc[field.name]
      if (Array.isArray(arrayItems)) {
        for (const item of arrayItems) {
          if (!item) continue
          await translateRelationships({
            doc: item,
            fields: field.fields,
            fromLocale,
            toLocale,
            depth,
            req,
            overrideAccess,
          })
        }
      }
    }
  }
}
