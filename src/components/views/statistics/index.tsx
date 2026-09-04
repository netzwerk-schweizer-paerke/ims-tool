import { notFound } from 'next/navigation'
import { DocumentViewServerProps } from 'payload'
import { ReactNode } from 'react'

import { MaintenanceToolbar } from '@/components/views/statistics/maintenance-toolbar'
import { MeterBar } from '@/components/views/statistics/meter-bar'
import { ParkTable } from '@/components/views/statistics/park-table'
import { SectionCard } from '@/components/views/statistics/section-card'
import { StatTile } from '@/components/views/statistics/stat-tile'
import { collectAdminStats } from '@/lib/admin-stats/collect-admin-stats'
import { formatBytes, formatCount } from '@/lib/admin-stats/format'
import { logger } from '@/lib/logger'
import { Translate } from '@/lib/translate'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * The whole edit view of the `statistics` global.
 *
 * Payload wraps a global document route in `DefaultTemplate` already, so this view draws no
 * admin chrome of its own. The global's `access.read` is the primary gate. The role check
 * here is the second one, because a permission rule and a rendered page can drift apart.
 */
export const StatisticsView = async ({ initPageResult }: DocumentViewServerProps) => {
  const { req } = initPageResult

  if (!checkUserRoles([ROLE_SUPER_ADMIN], req.user)) {
    notFound()
  }

  // The admin language, not the content locale. It drives every number on this page.
  const locale = req.i18n.language
  const stats = await collectAdminStats(req.payload)
  const contentTotal =
    stats.content.totals.activities +
    stats.content.totals['task-flows'] +
    stats.content.totals['task-lists']

  logger.info(
    `admin/views/statistics: built a report over ${stats.parks.length} parks for user ${req.user?.id}`,
  )

  return (
    <div className={'flex flex-col gap-6'} style={{ padding: 'var(--gutter-h)' }}>
      <div className={'flex flex-wrap items-center justify-between gap-4'}>
        <h1 className={'m-0 text-xl font-semibold [color:var(--theme-text)]'}>
          <Translate k={'statistics:title'} />
        </h1>
        <MaintenanceToolbar locale={locale} parks={stats.parks} />
      </div>

      <div className={'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7'}>
        <StatTile
          label={<Translate k={'statistics:kpi:parks'} />}
          value={formatCount(stats.parks.length, locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:users'} />}
          value={formatCount(stats.users.total, locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:activities'} />}
          value={formatCount(stats.content.totals.activities, locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:taskFlows'} />}
          value={formatCount(stats.content.totals['task-flows'], locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:taskLists'} />}
          value={formatCount(stats.content.totals['task-lists'], locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:documents'} />}
          value={formatCount(stats.content.totals.documents, locale)}
        />
        <StatTile
          label={<Translate k={'statistics:kpi:storage'} />}
          value={formatBytes(stats.storage.totalBytes, locale)}
        />
      </div>

      <SectionCard title={<Translate k={'statistics:card:tenants'} />}>
        <ParkTable locale={locale} rows={stats.parks} />
      </SectionCard>

      <div className={'grid gap-6 lg:grid-cols-3'}>
        <SectionCard title={<Translate k={'statistics:card:users'} />}>
          <dl className={'m-0 flex flex-col gap-2 text-sm'}>
            <Row
              label={<Translate k={'statistics:users:total'} />}
              value={formatCount(stats.users.total, locale)}
            />
            <Row
              label={<Translate k={'statistics:users:roleAdmin'} />}
              value={formatCount(stats.users.superAdmins, locale)}
            />
            <Row
              label={<Translate k={'statistics:users:noPark'} />}
              value={formatCount(stats.users.noPark, locale)}
            />
          </dl>
        </SectionCard>

        <SectionCard title={<Translate k={'statistics:card:content'} />}>
          <dl className={'m-0 flex flex-col gap-2 text-sm'}>
            <Row
              label={<Translate k={'statistics:kpi:media'} />}
              value={formatCount(stats.content.totals.media, locale)}
            />
            <Row
              label={<Translate k={'statistics:content:documentsPublic'} />}
              value={formatCount(stats.content.documentsPublic, locale)}
            />
            <Row
              label={<Translate k={'statistics:content:shareLinks'} />}
              value={formatCount(stats.content.shareLinks, locale)}
            />
          </dl>

          <div className={'flex flex-col gap-2'}>
            <span className={'text-xs [color:var(--theme-elevation-500)]'}>
              <Translate k={'statistics:content:perLocale'} />
            </span>
            {stats.content.perLocale.map((entry) => (
              <div className={'flex flex-col gap-1'} key={entry.locale}>
                <div className={'flex justify-between text-xs [color:var(--theme-elevation-500)]'}>
                  <span className={'uppercase'}>{entry.locale}</span>
                  <span className={'tabular-nums'}>
                    <Translate
                      k={'statistics:content:translated'}
                      vars={{
                        done: formatCount(entry.named, locale),
                        total: formatCount(entry.total, locale),
                      }}
                    />
                  </span>
                </div>
                <MeterBar
                  label={`${entry.locale}: ${entry.named} / ${entry.total}`}
                  total={contentTotal}
                  value={entry.named}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          note={<Translate k={'statistics:storage:publicNote'} />}
          title={<Translate k={'statistics:card:storage'} />}>
          <span className={'text-xs [color:var(--theme-elevation-500)]'}>
            <Translate k={'statistics:storage:perCollection'} />
          </span>
          <dl className={'m-0 flex flex-col gap-2 text-sm'}>
            {stats.storage.byCollection.map((entry) => (
              <Row
                key={entry.collection}
                label={`${entry.collection} (${formatCount(entry.files, locale)})`}
                value={formatBytes(entry.bytes, locale)}
              />
            ))}
          </dl>
        </SectionCard>
      </div>

      <SectionCard title={<Translate k={'statistics:card:technical'} />}>
        <dl className={'m-0 grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3'}>
          <Row
            label={<Translate k={'statistics:technical:node'} />}
            value={stats.technical.nodeVersion}
          />
          <Row
            label={<Translate k={'statistics:technical:environment'} />}
            value={stats.technical.environment}
          />
          <Row
            label={<Translate k={'statistics:technical:contentLocales'} />}
            value={stats.technical.contentLocales.join(', ')}
          />
          <Row
            label={<Translate k={'statistics:technical:adminLanguages'} />}
            value={stats.technical.adminLanguages.join(', ')}
          />
          <Row
            label={<Translate k={'statistics:technical:s3Endpoint'} />}
            value={stats.technical.s3Endpoint || <Translate k={'statistics:technical:unset'} />}
          />
          <Row
            label={<Translate k={'statistics:technical:s3Bucket'} />}
            value={stats.technical.s3Bucket || <Translate k={'statistics:technical:unset'} />}
          />
          <Row
            label={<Translate k={'statistics:technical:migrationsApplied'} />}
            value={formatCount(stats.technical.migrationsApplied, locale)}
          />
          <Row
            label={<Translate k={'statistics:technical:migrationsPending'} />}
            value={formatCount(
              Math.max(stats.technical.migrationsDeclared - stats.technical.migrationsApplied, 0),
              locale,
            )}
          />
          <Row
            label={<Translate k={'statistics:technical:migrationsLatest'} />}
            value={
              stats.technical.migrationsLatestName ?? <Translate k={'statistics:technical:unset'} />
            }
          />
        </dl>
      </SectionCard>
    </div>
  )
}

const Row = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
  <div className={'flex items-baseline justify-between gap-4'}>
    <dt className={'[color:var(--theme-elevation-500)]'}>{label}</dt>
    <dd className={'m-0 tabular-nums [color:var(--theme-text)]'}>{value}</dd>
  </div>
)
