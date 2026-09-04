'use client'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import {
  TenantHealthEntityRef,
  TenantHealthFinding,
  TenantHealthPreconditionResult,
  TenantHealthReport,
  TenantHealthSeverity,
} from '@/lib/tenant-health-checker'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

export type Translator = (key: never, vars?: Record<string, unknown>) => string

const SEVERITY_ORDER: TenantHealthSeverity[] = ['blocking', 'degrading']

interface HealthReportProps {
  /**
   * Passed by the per-document check so a finding in the open document scrolls into view
   * instead of reloading the page. The park-wide report omits it — every finding there is
   * in some other document, so those links always navigate.
   */
  onJump?: (anchor: string) => void
  report: TenantHealthReport
  /** Park-wide reports name the organisation; a single-document check does not need to. */
  showOrganisation?: boolean
}

/**
 * Renders a health report. Shared by the park-wide check on the activities list and the
 * per-document check on the edit view, so both read identically.
 */
export const HealthReport = ({ onJump, report, showOrganisation = false }: HealthReportProps) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const translate = t as Translator

  const failedPreconditions = Object.entries(report.preconditions).filter(([, value]) => !value.ok)
  // Public documents are shared installation-wide, so their problems are not this park's
  // to fix and would otherwise be repeated identically in every park's report.
  const sharedFindings = report.findings.filter((finding) => finding.scope === 'shared')

  return (
    <>
      {showOrganisation && (
        <p className="text-[var(--theme-text-light)]">
          <strong>{report.organisation.name}</strong> —{' '}
          {translate('dataHealth:counts' as never, report.counts)}
        </p>
      )}

      {failedPreconditions.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            {t('dataHealth:preconditionFailed' as never)}
          </h2>
          <p className="mb-2 text-sm text-amber-800">{t('dataHealth:preconditionHint' as never)}</p>
          <ul className="list-disc space-y-1 pl-5">
            {failedPreconditions.map(([key, value]) => (
              <li className="text-sm text-amber-900" key={key}>
                {preconditionMessage(translate, value)}
                {value.error && (
                  <div className="break-all font-mono text-xs opacity-70">{value.error}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.findings.length === 0 && failedPreconditions.length === 0 && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {t(
            showOrganisation
              ? ('dataHealth:healthy' as never)
              : ('dataHealth:healthyDocument' as never),
          )}
        </p>
      )}

      {SEVERITY_ORDER.map((severity) => {
        const findings = report.findings.filter(
          (finding) => finding.severity === severity && finding.scope !== 'shared',
        )
        if (findings.length === 0) return null

        return (
          <FindingGroup
            findings={findings}
            hint={t(
              severity === 'blocking'
                ? ('dataHealth:blockingHint' as never)
                : ('dataHealth:degradingHint' as never),
            )}
            key={severity}
            onJump={onJump}
            severity={severity}
            title={`${t(
              severity === 'blocking'
                ? ('dataHealth:blocking' as never)
                : ('dataHealth:degrading' as never),
            )} (${findings.length})`}
          />
        )
      })}

      {sharedFindings.length > 0 && (
        <FindingGroup
          findings={sharedFindings}
          hint={t('dataHealth:sharedHint' as never)}
          onJump={onJump}
          severity="degrading"
          title={`${t('dataHealth:shared' as never)} (${sharedFindings.length})`}
        />
      )}
    </>
  )
}

interface EntityLinkProps {
  anchor?: string
  label: string
  /** Provided only by the per-document check, which can scroll instead of navigating. */
  onJump?: (anchor: string) => void
  target: TenantHealthEntityRef
}

const EntityLink = ({ anchor, label, onJump, target }: EntityLinkProps) => {
  const href = `/admin/collections/${target.collection}/${target.id}${anchor ? `#${anchor}` : ''}`
  const isCurrentDocument =
    typeof window !== 'undefined' && window.location.pathname === href.split('#', 1)[0]
  const jumpsInPage = Boolean(anchor && onJump && isCurrentDocument)

  const onClick = (event: React.MouseEvent) => {
    if (!jumpsInPage) {
      return
    }

    // Scroll rather than navigate, so the check result stays on screen.
    event.preventDefault()
    onJump!(anchor!)
  }

  return (
    <a
      className="underline underline-offset-2"
      href={href}
      onClick={onClick}
      rel="noopener noreferrer"
      target={jumpsInPage ? undefined : '_blank'}>
      {label}
    </a>
  )
}

/**
 * Scrolls a block row into view, expanding it if collapsed and flashing an outline.
 *
 * Uses inline styles rather than a class because Tailwind only emits classes it finds in
 * source, and this one is only ever applied at runtime.
 */
export const focusAnchor = (anchor: string): boolean => {
  const element = document.querySelector(`#${anchor}`)

  if (!(element instanceof HTMLElement)) {
    return false
  }

  const toggle = element.querySelector('.collapsible__toggle')

  if (toggle instanceof HTMLElement && !toggle.classList.contains('collapsible__toggle--open')) {
    toggle.click()
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.style.outline = '2px solid #f59e0b'
  element.style.outlineOffset = '4px'

  setTimeout(() => {
    element.style.outline = ''
    element.style.outlineOffset = ''
  }, 3000)

  return true
}

interface FindingGroupProps {
  findings: TenantHealthFinding[]
  hint: string
  onJump?: (anchor: string) => void
  severity: TenantHealthSeverity
  title: string
}

const FindingGroup = ({ findings, hint, onJump, severity, title }: FindingGroupProps) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const translate = t as Translator

  const tone =
    severity === 'blocking'
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-amber-200 bg-amber-50 text-amber-900'

  return (
    <section className={`rounded-lg border p-4 ${tone}`}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-sm opacity-80">{hint}</p>
      <div className="max-h-96 overflow-y-auto">
        <ul className="space-y-3">
          {findings.map((finding, index) => (
            <li key={`${finding.code}-${finding.source.id}-${index}`}>
              <div className="text-sm font-medium">{locationLabel(translate, finding)}</div>
              <div className="text-sm">{findingMessage(translate, finding)}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <EntityLink
                  anchor={finding.location?.anchor}
                  label={t(
                    finding.location?.anchor
                      ? ('dataHealth:jumpToBlock' as never)
                      : ('dataHealth:openSource' as never),
                  )}
                  onJump={onJump}
                  target={finding.source}
                />
                {finding.related && (
                  <EntityLink
                    label={t('dataHealth:openRelated' as never)}
                    target={finding.related}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * The headline for a finding: which item and, when known, which block inside it.
 *
 * This replaces the raw dotted path in the UI — the path is precise but nobody can locate
 * `blocks.de[0].keypoints.keypoints.root.children[0]` by reading it.
 */
const locationLabel = (t: Translator, finding: TenantHealthFinding): string => {
  const parts = [`${finding.source.collection} #${finding.source.id}`]
  const { location } = finding

  if (location?.rowNumber) {
    parts.push(rowLabel(t, location.container, location.rowNumber))
  }

  if (location?.field) {
    parts.push(fieldLabel(t, location.field))
  }

  if (location?.locale) {
    parts.push(location.locale.toUpperCase())
  }

  return parts.join(' · ')
}

/** Blocks, list entries and file rows all use `<field>-row-N`, but read differently. */
const rowLabel = (t: Translator, container: string | undefined, number: number): string => {
  switch (container) {
    case 'files': {
      return t('dataHealth:fileNumber' as never, { number })
    }
    case 'items': {
      return t('dataHealth:itemNumber' as never, { number })
    }
    default: {
      return t('dataHealth:blockNumber' as never, { number })
    }
  }
}

/** Known block sub-fields get a translated label; anything else shows its raw name. */
const fieldLabel = (t: Translator, field: string): string => {
  switch (field) {
    case 'description': {
      return t('dataHealth:field:description' as never)
    }
    case 'document': {
      return t('dataHealth:field:document' as never)
    }
    case 'files': {
      return t('dataHealth:field:files' as never)
    }
    case 'infos': {
      return t('dataHealth:field:infos' as never)
    }
    case 'io': {
      return t('dataHealth:field:io' as never)
    }
    case 'keypoints': {
      return t('dataHealth:field:keypoints' as never)
    }
    case 'relations': {
      return t('dataHealth:field:relations' as never)
    }
    case 'responsibility': {
      return t('dataHealth:field:responsibility' as never)
    }
    case 'tools': {
      return t('dataHealth:field:tools' as never)
    }
    default: {
      return field
    }
  }
}

/**
 * Static keys per code — a template literal would not be greppable, and a missing key
 * renders blank rather than failing loudly.
 */
export const findingMessage = (t: Translator, finding: TenantHealthFinding): string => {
  const { params } = finding

  switch (finding.code) {
    case 'crossOrgReference': {
      return t('dataHealth:finding:crossOrgReference' as never, params)
    }
    case 'crossOrgReferenceFollowed': {
      return t('dataHealth:finding:crossOrgReferenceFollowed' as never, params)
    }
    case 'danglingReference': {
      return t('dataHealth:finding:danglingReference' as never, params)
    }
    case 'danglingReferenceFollowed': {
      return t('dataHealth:finding:danglingReferenceFollowed' as never, params)
    }
    case 'documentIncomplete': {
      return t('dataHealth:finding:documentIncomplete' as never, params)
    }
    case 'externalUrlMalformed': {
      return t('dataHealth:finding:externalUrlMalformed' as never, params)
    }
    case 'externalUrlNotFound': {
      return t('dataHealth:finding:externalUrlNotFound' as never, params)
    }
    case 'externalUrlUnreachable': {
      return t('dataHealth:finding:externalUrlUnreachable' as never, params)
    }
    case 'malformedRichTextNoChildren': {
      return t('dataHealth:finding:malformedRichTextNoChildren' as never, params)
    }
    case 'malformedRichTextNotObject': {
      return t('dataHealth:finding:malformedRichTextNotObject' as never, params)
    }
    case 'malformedRichTextRoot': {
      return t('dataHealth:finding:malformedRichTextRoot' as never, params)
    }
    case 'missingRequiredField': {
      return t('dataHealth:finding:missingRequiredField' as never, params)
    }
    case 'prefixOrganisationMismatch': {
      return t('dataHealth:finding:prefixOrganisationMismatch' as never, params)
    }
    case 's3ObjectMissing': {
      return t('dataHealth:finding:s3ObjectMissing' as never, params)
    }
    case 's3ObjectUnreadable': {
      return t('dataHealth:finding:s3ObjectUnreadable' as never, params)
    }
  }
}

export const preconditionMessage = (
  t: Translator,
  result: TenantHealthPreconditionResult,
): string => {
  switch (result.code) {
    case 's3BucketMissing': {
      return t('dataHealth:precondition:s3BucketMissing' as never)
    }
    case 's3Unreachable': {
      return t('dataHealth:precondition:s3Unreachable' as never)
    }
    default: {
      return ''
    }
  }
}
