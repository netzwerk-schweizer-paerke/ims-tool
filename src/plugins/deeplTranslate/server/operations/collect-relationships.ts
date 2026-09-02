/**
 * Function to traverse and collect relationships from a document
 * This replaces the translateRelationships function with a simpler collection approach
 */

import type { Field } from 'payload'

import { isArray } from 'es-toolkit/compat'
import { tabHasName } from 'payload/shared'

import type { RelationshipCollector } from '../collectors/relationship-collector'

/** Narrows an unknown document value so the walk can index into it. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export async function collectRelationships(args: {
  collector: RelationshipCollector
  depth: number
  doc: Record<string, unknown>
  fields: Field[]
  path?: string
}): Promise<void> {
  const { collector, depth, doc, fields, path = 'root' } = args

  if (depth <= 0) {
    return
  }

  for (const field of fields) {
    const fieldPath = `${path}.${'name' in field ? field.name : field.type}`

    // Handle relationship fields
    if (field.type === 'relationship' && doc[field.name]) {
      const relationValue = doc[field.name]
      const relationTo: string[] = isArray(field.relationTo)
        ? field.relationTo
        : [field.relationTo]

      // Handle single or multiple relationships
      const relations: unknown[] = isArray(relationValue) ? relationValue : [relationValue]

      for (const relation of relations) {
        if (!relation) continue

        // Extract ID from relation
        const relationId = extractIdFromPolymorphicRelation(relation)
        if (!relationId) continue

        // Determine collection - for polymorphic relationships, check if relation has relationTo
        let relationCollection: null | string = null
        if (isRecord(relation) && 'relationTo' in relation) {
          relationCollection = typeof relation.relationTo === 'string' ? relation.relationTo : null
        } else if (relationTo.length === 1) {
          relationCollection = relationTo[0]
        }

        if (relationCollection) {
          collector.addDocument(relationCollection, relationId, depth - 1, fieldPath)
        }
      }
    }

    // Handle nested fields in groups
    if (field.type === 'group' && 'name' in field) {
      const groupDoc = doc[field.name]
      if (isRecord(groupDoc)) {
        await collectRelationships({
          collector,
          depth,
          doc: groupDoc,
          fields: field.fields,
          path: fieldPath,
        })
      }
    }

    // Handle row fields - these contain nested fields
    if (field.type === 'row' && field.fields) {
      await collectRelationships({
        collector,
        depth,
        doc: doc,
        fields: field.fields,
        path: fieldPath,
      })
    }

    // Handle tabs fields - these contain tabs with nested fields
    if (field.type === 'tabs' && field.tabs) {
      for (const tab of field.tabs) {
        // An unnamed tab has no own key in the document, so the walk cannot descend into it.
        if (!tabHasName(tab)) continue

        const tabDoc = doc[tab.name]
        if (tab.fields && isRecord(tabDoc)) {
          await collectRelationships({
            collector,
            depth,
            doc: tabDoc,
            fields: tab.fields,
            path: `${fieldPath}.${tab.name}`,
          })
        }
      }
    }

    // Handle blocks - each block can have different fields
    if (field.type === 'blocks' && doc[field.name]) {
      const blocks = doc[field.name]
      if (isArray(blocks)) {
        for (let i = 0; i < blocks.length; i++) {
          const block: unknown = blocks[i]
          if (!isRecord(block) || typeof block.blockType !== 'string') continue

          const blockType = block.blockType

          // Find the block definition
          const blockDef = field.blocks.find((b) => b.slug === blockType)
          if (blockDef && blockDef.fields) {
            await collectRelationships({
              collector,
              depth,
              doc: block,
              fields: blockDef.fields,
              path: `${fieldPath}[${i}].${blockType}`,
            })
          }
        }
      }
    }

    // Handle arrays - all items have the same fields
    if (field.type === 'array' && field.fields && doc[field.name]) {
      const arrayItems = doc[field.name]
      if (isArray(arrayItems)) {
        for (let i = 0; i < arrayItems.length; i++) {
          const item: unknown = arrayItems[i]
          if (!isRecord(item)) continue
          await collectRelationships({
            collector,
            depth,
            doc: item,
            fields: field.fields,
            path: `${fieldPath}[${i}]`,
          })
        }
      }
    }
  }
}

// Helper function to extract ID from polymorphic relationships
function extractIdFromPolymorphicRelation(relation: unknown): null | number | string {
  // Handle polymorphic relationships: { relationTo: "collection", value: { id: 123, ... } }
  if (isRecord(relation) && 'relationTo' in relation && 'value' in relation) {
    const value = relation.value
    if (isRecord(value) && 'id' in value) {
      return value.id as number | string
    }
  }
  // Handle regular populated relationships: { id: 123, ... }
  if (isRecord(relation) && 'id' in relation) {
    return relation.id as number | string
  }
  // Handle simple ID references
  if (typeof relation === 'string' || typeof relation === 'number') {
    return relation
  }
  return null
}
