/**
 * Function to traverse and collect relationships from a document
 * This replaces the translateRelationships function with a simpler collection approach
 */

import { relationshipCollector } from '../collectors/relationship-collector'

// Helper function to extract ID from polymorphic relationships
function extractIdFromPolymorphicRelation(relation: any): string | number | null {
  // Handle polymorphic relationships: { relationTo: "collection", value: { id: 123, ... } }
  if (relation && typeof relation === 'object' && 'relationTo' in relation && 'value' in relation) {
    const value = relation.value
    if (value && typeof value === 'object' && 'id' in value) {
      return value.id as string | number
    }
  }
  // Handle regular populated relationships: { id: 123, ... }
  if (relation && typeof relation === 'object' && 'id' in relation) {
    return relation.id as string | number
  }
  // Handle simple ID references
  if (typeof relation === 'string' || typeof relation === 'number') {
    return relation
  }
  return null
}

export async function collectRelationships(args: {
  doc: Record<string, any>
  fields: any[]
  depth: number
  path?: string
}): Promise<void> {
  const { doc, fields, depth, path = 'root' } = args

  if (depth <= 0) {
    return
  }

  for (const field of fields) {
    const fieldPath = `${path}.${field.name || field.type}`

    // Handle relationship fields
    if (field.type === 'relationship' && doc[field.name]) {
      const relationValue = doc[field.name]
      const relationTo = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]

      // Handle single or multiple relationships
      const relations = Array.isArray(relationValue) ? relationValue : [relationValue]

      for (const relation of relations) {
        if (!relation) continue

        // Extract ID from relation
        const relationId = extractIdFromPolymorphicRelation(relation)
        if (!relationId) continue

        // Determine collection - for polymorphic relationships, check if relation has relationTo
        let relationCollection = null
        if (typeof relation === 'object' && 'relationTo' in relation) {
          relationCollection = relation.relationTo
        } else if (relationTo.length === 1) {
          relationCollection = relationTo[0]
        }

        if (relationCollection) {
          relationshipCollector.addDocument(relationCollection, relationId, depth - 1, fieldPath)
        }
      }
    }

    // Handle nested fields in groups
    if (field.type === 'group' && field.fields && doc[field.name]) {
      await collectRelationships({
        doc: doc[field.name],
        fields: field.fields,
        depth,
        path: fieldPath,
      })
    }

    // Handle row fields - these contain nested fields
    if (field.type === 'row' && field.fields) {
      await collectRelationships({
        doc: doc,
        fields: field.fields,
        depth,
        path: fieldPath,
      })
    }

    // Handle tabs fields - these contain tabs with nested fields
    if (field.type === 'tabs' && field.tabs) {
      for (const tab of field.tabs) {
        if (tab.fields && doc[tab.name]) {
          await collectRelationships({
            doc: doc[tab.name],
            fields: tab.fields,
            depth,
            path: `${fieldPath}.${tab.name}`,
          })
        }
      }
    }

    // Handle blocks - each block can have different fields
    if (field.type === 'blocks' && doc[field.name]) {
      const blocks = doc[field.name]
      if (Array.isArray(blocks)) {
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i]
          if (!block || !block.blockType) continue

          // Find the block definition
          const blockDef = field.blocks.find((b: any) => b.slug === block.blockType)
          if (blockDef && blockDef.fields) {
            await collectRelationships({
              doc: block,
              fields: blockDef.fields,
              depth,
              path: `${fieldPath}[${i}].${block.blockType}`,
            })
          }
        }
      }
    }

    // Handle arrays - all items have the same fields
    if (field.type === 'array' && field.fields && doc[field.name]) {
      const arrayItems = doc[field.name]
      if (Array.isArray(arrayItems)) {
        for (let i = 0; i < arrayItems.length; i++) {
          const item = arrayItems[i]
          if (!item) continue
          await collectRelationships({
            doc: item,
            fields: field.fields,
            depth,
            path: `${fieldPath}[${i}]`,
          })
        }
      }
    }
  }
}
