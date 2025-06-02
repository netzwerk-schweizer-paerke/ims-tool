import * as fs from 'fs'
import * as path from 'path'

/**
 * Recursively removes all "i18n" keys and their children from objects and arrays
 * @param data The data to process
 * @returns The data with i18n keys removed
 */
const removeI18nKeys = (data: any): any => {
  if (!data) return data

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => removeI18nKeys(item))
  }

  // Handle objects
  if (typeof data === 'object') {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      // Skip i18n keys
      if (key === 'i18n') continue

      // Recursively process other keys
      result[key] = removeI18nKeys(value)
    }

    return result
  }

  // Return primitives as is
  return data
}

/**
 * Extracts and saves translation data to a JSON file for debugging or analysis
 * @param dataFrom The source data to be translated
 * @param configFields The field configuration for translation
 * @param baseName Optional base name for the file (defaults to 'translation-data')
 * @returns The path to the saved file
 */
export const extractTranslationData = (
  dataFrom: Record<string, any>,
  configFields: any,
  baseName = 'translation-data'
): string => {
  // Remove i18n keys from the data
  const cleanedDataFrom = removeI18nKeys(dataFrom)
  const cleanedConfigFields = removeI18nKeys(configFields)

  const extractedData = {
    dataFrom: cleanedDataFrom,
    configFields: cleanedConfigFields
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = path.join(__dirname, `${baseName}-${timestamp}.json`)

  fs.writeFileSync(
    filename,
    JSON.stringify(extractedData, null, 2),
    'utf8'
  )

  console.log(`Extracted translation data saved to ${filename}`)
  return filename
}
