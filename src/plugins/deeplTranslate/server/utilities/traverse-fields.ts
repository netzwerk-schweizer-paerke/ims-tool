import type { Field } from 'payload'

import ObjectID from 'bson-objectid'
import { tabHasName } from 'payload/shared'

import type { ValueToTranslate } from '../types'

import { isEmpty } from '../../utils/isEmpty'
import { traverseRichText } from './traverse-rich-text'
import { isObject } from 'lodash-es'

export const traverseFields = ({
  dataFrom,
  emptyOnly,
  fields,
  localizedParent,
  siblingDataFrom,
  siblingDataTranslated,
  translatedData,
  valuesToTranslate,
}: {
  dataFrom: Record<string, unknown>
  emptyOnly?: boolean
  fields: Field[]
  localizedParent?: boolean
  siblingDataFrom?: Record<string, unknown>
  siblingDataTranslated?: Record<string, unknown>
  translatedData: Record<string, unknown>
  valuesToTranslate: ValueToTranslate[]
}) => {
  siblingDataFrom = siblingDataFrom ?? dataFrom
  siblingDataTranslated = siblingDataTranslated ?? translatedData

  for (const field of fields) {
    // Skip virtual payload fields as they can't be translated
    if ('virtual' in field && field.virtual) {
      continue
    }

    switch (field.type) {
      case 'array': {
        const arrayDataFrom = siblingDataFrom[field.name] as {
          id: string
        }[]

        if (isEmpty(arrayDataFrom)) {
          break
        }

        let arrayDataTranslated =
          (siblingDataTranslated[field.name] as { id: string }[] | undefined) ?? []

        if (field.localized || localizedParent) {
          if (arrayDataTranslated.length > 0 && emptyOnly) {
            break
          }

          arrayDataTranslated = arrayDataFrom.map(() => ({
            id: ObjectID().toHexString(),
          }))
        }

        arrayDataTranslated.forEach((item, index) => {
          traverseFields({
            dataFrom,
            emptyOnly,
            fields: field.fields,
            localizedParent: localizedParent ?? field.localized,
            siblingDataFrom: arrayDataFrom[index], // This passes the correct array item data
            siblingDataTranslated: item,
            translatedData,
            valuesToTranslate,
          })
        })

        siblingDataTranslated[field.name] = arrayDataTranslated

        break
      }

      case 'blocks': {
        const blocksDataFrom = siblingDataFrom[field.name] as {
          blockType: string
          id: string
        }[]

        if (isEmpty(blocksDataFrom)) {
          break
        }

        let blocksDataTranslated =
          (siblingDataTranslated[field.name] as { blockType: string; id: string }[] | undefined) ??
          []

        if (field.localized || localizedParent) {
          if (blocksDataTranslated.length > 0 && emptyOnly) {
            break
          }

          blocksDataTranslated = blocksDataFrom.map(({ blockType }) => ({
            id: ObjectID().toHexString(),
            blockType,
          }))
        }

        blocksDataTranslated.forEach((item, index) => {
          const block = field.blocks.find((each) => each.slug === item.blockType)

          if (!block) {
            return
          }

          // Use the specific block data as the new context
          const blockDataFrom = blocksDataFrom[index]

          traverseFields({
            dataFrom,
            emptyOnly,
            fields: block.fields,
            localizedParent: localizedParent ?? field.localized,
            siblingDataFrom: blockDataFrom, // Pass the specific block data
            siblingDataTranslated: item,
            translatedData,
            valuesToTranslate,
          })
        })

        siblingDataTranslated[field.name] = blocksDataTranslated

        break
      }

      case 'checkbox':
      case 'code':
      case 'date':
      case 'email':
      case 'number':
      case 'point':
      case 'radio':
      case 'select':
      case 'upload':
        siblingDataTranslated[field.name] = siblingDataFrom[field.name]
        break

      case 'relationship':
        // Copy the relationship reference as-is
        // Relationship translation will be handled separately in the operation
        siblingDataTranslated[field.name] = siblingDataFrom[field.name]
        break
      case 'json':
        siblingDataTranslated[field.name] = siblingDataFrom[field.name]

        try {
          const jsonValue = siblingDataFrom[field.name]

          // Check if the JSON value is an object with a text property
          if (isObject(jsonValue) && jsonValue !== null) {
            // Handle objects with a text property
            if ('text' in jsonValue && typeof jsonValue.text === 'string') {
              valuesToTranslate.push({
                onTranslate: (translated: string) => {
                  try {
                    // Safely update the text property
                    const targetObject = siblingDataTranslated[field.name]
                    if (isObject(targetObject) && targetObject !== null) {
                      ;(targetObject as any).text = translated
                    }
                  } catch (e) {
                    console.warn(
                      `Failed to update translated text for JSON field ${field.name}:`,
                      e,
                    )
                  }
                },
                value: jsonValue.text,
              })
            }
          }
        } catch (e) {
          // Log the error but continue processing other fields
          console.warn(`Error processing JSON field ${field.name}:`, e)
        }

        break
      case 'collapsible':
      case 'row':
        traverseFields({
          dataFrom,
          emptyOnly,
          fields: field.fields,
          localizedParent,
          siblingDataFrom,
          siblingDataTranslated,
          translatedData,
          valuesToTranslate,
        })
        break
      case 'group': {
        if ('name' in field) {
          const groupDataFrom = siblingDataFrom[field.name] as Record<string, unknown>

          if (!groupDataFrom) {
            break
          }

          const groupDataTranslated =
            (siblingDataTranslated[field.name] as Record<string, unknown>) ?? {}

          traverseFields({
            dataFrom,
            emptyOnly,
            fields: field.fields,
            localizedParent: localizedParent ?? field.localized,
            siblingDataFrom: groupDataFrom, // Pass the specific group data
            siblingDataTranslated: groupDataTranslated,
            translatedData,
            valuesToTranslate,
          })

          // Ensure the translated group data is set in the parent
          siblingDataTranslated[field.name] = groupDataTranslated
        } else {
          throw new Error('Unnamed group fields are not supported')
        }

        break
      }
      case 'richText': {
        if (!(field.localized || localizedParent) || isEmpty(siblingDataFrom[field.name])) {
          break
        }
        if (emptyOnly && siblingDataTranslated[field.name]) {
          break
        }

        const richTextDataFrom = siblingDataFrom[field.name] as object

        if (!richTextDataFrom) {
          break
        }

        // Only handle Lexical editor content (has root property)
        if (!('root' in richTextDataFrom)) {
          break
        }

        // Deep clone the Lexical content to avoid reference issues
        const clonedRichText = JSON.parse(JSON.stringify(richTextDataFrom))
        siblingDataTranslated[field.name] = clonedRichText

        const root = clonedRichText.root as Record<string, unknown>

        if (root) {
          traverseRichText({
            onText: (siblingData) => {
              // Make sure we're getting the text value correctly
              if (siblingData.text && typeof siblingData.text === 'string') {
                valuesToTranslate.push({
                  onTranslate: (translated: string) => {
                    siblingData.text = translated
                  },
                  value: siblingData.text,
                })
              }
            },
            root,
          })
        }

        break
      }

      case 'tabs':
        for (const tab of field.tabs) {
          const hasName = tabHasName(tab)

          const tabDataFrom = hasName
            ? (siblingDataFrom[tab.name] as Record<string, unknown>)
            : siblingDataFrom

          if (!tabDataFrom) {
            continue // Changed from return to continue to process other tabs
          }

          const tabDataTranslated = hasName
            ? ((siblingDataTranslated[tab.name] as Record<string, unknown>) ?? {})
            : siblingDataTranslated

          traverseFields({
            dataFrom,
            emptyOnly,
            fields: tab.fields,
            localizedParent: localizedParent ?? tab.localized,
            siblingDataFrom: tabDataFrom, // Pass the specific tab data
            siblingDataTranslated: tabDataTranslated,
            translatedData,
            valuesToTranslate,
          })

          // Ensure the translated tab data is set in the parent if it has a name
          if (hasName) {
            siblingDataTranslated[tab.name] = tabDataTranslated
          }
        }

        break
      case 'text':
      case 'textarea':
        if (field.custom && typeof field.custom === 'object' && field.custom.deepltranslateSkip) {
          break
        }

        if (!(field.localized || localizedParent) || isEmpty(siblingDataFrom[field.name])) {
          break
        }
        if (emptyOnly && siblingDataTranslated[field.name]) {
          break
        }

        // do not translate the block ID or admin-facing label
        if (field.name === 'blockName' || field.name === 'id') {
          break
        }

        valuesToTranslate.push({
          onTranslate: (translated: string) => {
            siblingDataTranslated[field.name] = translated
          },
          value: siblingDataFrom[field.name] as string | undefined,
        })
        break

      default:
        break
    }
  }
}
