import { describe, expect, test, vi } from 'vitest'

import { TenantHealthFinding } from '@/lib/tenant-health-checker'
import { de } from '@/lib/translations/de'

import { findingMessage, Translator } from './health-report'

// `@payloadcms/ui` pulls a stylesheet through its entry point, and vitest cannot load CSS.
// `findingMessage` is a pure function, so the stub only has to satisfy the import.
vi.mock('@payloadcms/ui', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

/** Records the key the switch picked, and interpolates like i18next does. */
const translator: Translator = (key, vars) =>
  `${key}|${Object.entries(vars ?? {})
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(',')}`

const finding = (partial: Partial<TenantHealthFinding>): TenantHealthFinding => ({
  code: 'missingParkLanguageName',
  params: {},
  severity: 'degrading',
  source: { collection: 'activities', id: 1 },
  ...partial,
})

describe('findingMessage', () => {
  test('sends a name missing in the park language to its own message', () => {
    const message = findingMessage(
      translator,
      finding({ params: { field: 'name', locale: 'it' } }),
    )

    expect(message).toBe('dataHealth:finding:missingParkLanguageName|field=name,locale=it')
  })

  test('sends a name missing everywhere to a message that names no language', () => {
    const message = findingMessage(
      translator,
      finding({
        code: 'missingNameInEveryLocale',
        params: { field: 'name' },
        severity: 'blocking',
      }),
    )

    expect(message).toBe('dataHealth:finding:missingNameInEveryLocale|field=name')
  })

  test('sends a missing unlocalised field to a message that names no language', () => {
    const message = findingMessage(
      translator,
      finding({ code: 'missingRequiredFieldUnlocalised', params: { field: 'variant' } }),
    )

    expect(message).toBe('dataHealth:finding:missingRequiredFieldUnlocalised|field=variant')
  })
})

describe('the German strings behind those keys', () => {
  test('names the park language, never the default locale', () => {
    expect(de.dataHealth.finding.missingParkLanguageName).toContain('Parksprache')
    expect(de.dataHealth.finding.missingParkLanguageName).toContain('{{locale}}')
  })

  test('leaves the language out of the two messages that have none', () => {
    expect(de.dataHealth.finding.missingNameInEveryLocale).not.toContain('{{locale}}')
    expect(de.dataHealth.finding.missingRequiredFieldUnlocalised).not.toContain('{{locale}}')
  })

  // Every message must end in something the editor can do, or the report only states a fact.
  test.each([
    'missingNameInEveryLocale',
    'missingParkLanguageName',
    'missingRequiredFieldUnlocalised',
  ] as const)('gives %s an instruction, not only a diagnosis', (code) => {
    expect(de.dataHealth.finding[code]).toMatch(/Tragen Sie|Ergänzen Sie|Wählen Sie/)
  })

  test('points the park-language hint at the organisation record', () => {
    expect(de.dataHealth.hintText.parkLanguageLikelyWrong).toContain('Organisationen')
  })

  // A degrading finding is now a missing translation as often as a missing file, so the hint
  // must not promise that the file is the cause.
  test('keeps the degrading hint free of the file claim', () => {
    expect(de.dataHealth.degradingHint).not.toContain('Datei')
  })
})
