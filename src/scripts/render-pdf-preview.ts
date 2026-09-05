/**
 * Renders one process PDF straight to a file, with no HTTP request and no session.
 *
 * The export endpoints resolve the park from a session or from a share token. Neither is available
 * from a terminal, so this script calls `buildProcessPdf` directly. Use it to review a layout
 * change without a browser.
 *
 *   yarn tsx src/scripts/render-pdf-preview.ts --help
 *   yarn tsx src/scripts/render-pdf-preview.ts --org 1 --target landscape --out /tmp/landscape.pdf
 */
/* eslint-disable unicorn/no-process-exit -- CLI entry point: the exit code is the result. */
import dotenv from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'

import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { buildProcessPdf } from '@/lib/pdf/build-process-pdf'
import { ShareTarget } from '@/lib/share-link-target'

dotenv.config()

const USAGE = `Usage: yarn tsx src/scripts/render-pdf-preview.ts [options]

Renders one process PDF to a file. It reads the database directly, so the dev
services must run. It writes nothing back.

Options:
  --org <id>        The organisation to export. Required unless --list is given.
  --target <kind>   landscape | activityBlock | flow | list. Default: landscape.
  --activity <id>   The activity, for --target activityBlock.
  --block <id>      The block id, for --target activityBlock.
  --flow <id>       The flow, for --target flow.
  --list <id>       The list, for --target list.
  --locale <code>   The content locale. Default: the config default.
  --deep            Add every page under the target.
  --out <path>      Where to write the file. Default: ./pdf-preview.pdf
  --list-parks      Print every organisation with its id, then exit.
  --help            Print this text.
`

const argOf = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`)

const numberArg = (name: string): number | undefined => {
  const raw = argOf(name)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    console.error(`--${name} needs a positive integer, and it read "${raw}".`)
    process.exit(1)
  }
  return parsed
}

const requireNumber = (name: string): number => {
  const value = numberArg(name)
  if (value === undefined) {
    console.error(`--${name} is required for this target.`)
    process.exit(1)
  }
  return value
}

const readTarget = (): ShareTarget => {
  switch (argOf('target') ?? 'landscape') {
    case 'activityBlock': {
      const blockId = argOf('block')
      if (!blockId) {
        console.error('--block is required for --target activityBlock.')
        process.exit(1)
      }
      return { activity: requireNumber('activity'), blockId, targetType: 'activityBlock' }
    }
    case 'flow': {
      return { targetType: 'flow', taskFlow: requireNumber('flow') }
    }
    case 'landscape': {
      return { targetType: 'activityLandscape' }
    }
    case 'list': {
      return { targetType: 'list', taskList: requireNumber('list') }
    }
    default: {
      console.error('--target must be landscape, activityBlock, flow or list.')
      process.exit(1)
    }
  }
}

const main = async () => {
  if (hasFlag('help') || hasFlag('h')) {
    console.log(USAGE)
    return
  }

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  if (hasFlag('list-parks')) {
    const parks = await payload.find({ collection: 'organisations', depth: 0, limit: 200, overrideAccess: true })
    for (const park of parks.docs) {
      console.log(`${park.id}\t${park.name}`)
    }
    return
  }

  const organisationId = requireNumber('org')
  const organisation = await payload.findByID({
    collection: 'organisations',
    depth: 0,
    id: organisationId,
    overrideAccess: true,
  })

  const locale = toContentLocale(argOf('locale'), payload.config)
  const localeCode = locale ?? getDefaultLocaleCode(payload.config)
  const out = argOf('out') ?? './pdf-preview.pdf'

  const { buffer, filename } = await buildProcessPdf({
    deep: hasFlag('deep'),
    // No reader opens this copy, so the QR code carries the local origin.
    hrefFor: () => `http://localhost:3000/admin?locale=${encodeURIComponent(localeCode)}`,
    locale,
    localeCode,
    organisationId,
    organisationName: organisation?.name ?? '',
    payload,
    target: readTarget(),
  })

  await writeFile(out, buffer)
  console.log(`${out}\t${buffer.length} bytes\t${filename}`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
