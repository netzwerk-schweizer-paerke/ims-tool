import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { it } from '@payloadcms/translations/languages/it'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { ADMIN_DATE_FORMAT } from '@/config/date-format'
import { seedDevUser } from '@/config/seed/dev-user'
import { adminStatsEndpoint } from '@/endpoints/admin-stats'
import { parkSearchEndpoint } from '@/endpoints/park-search'
import { processPdfEndpoint } from '@/endpoints/process-pdf'
import { s3OrphanDeleteEndpoint } from '@/endpoints/s3-orphan-delete'
import { s3OrphanDetectionEndpoint } from '@/endpoints/s3-orphan-detection'
import { tenantHealthEndpoint } from '@/endpoints/tenant-health'
import { customI18nTranslations } from '@/lib/custom-i18n-translations'
import { isLocalDevelopment } from '@/lib/environment'
import { migrations } from '@/migrations'
import { Activities } from '@/payload/collections/Activities'
import { Documents } from '@/payload/collections/Documents'
import { DocumentsPublic } from '@/payload/collections/DocumentsPublic'
import { Media } from '@/payload/collections/Media'
import { Organisations } from '@/payload/collections/Organisations'
import { ShareLinks } from '@/payload/collections/ShareLinks'
import { TaskFlows } from '@/payload/collections/TaskFlow'
import { TaskLists } from '@/payload/collections/TaskList'
import { Users } from '@/payload/collections/Users'
import { Statistics } from '@/payload/globals/Statistics'
import { deepLTranslate } from '@/plugins/deeplTranslate'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    ...((process.env.NODE_ENV !== 'production') && {
          autoLogin: {
            email: 'admin@test.com',
            password: 'admin',
            prefillOnly: true,
          },
        }),
    components: {
      beforeNavLinks: [
        '@/components/activity-landscape-link#ActivityLandscapeLink',
        '@/components/organisation-select#OrganisationSelect',
      ],
      graphics: {
        Icon: '@/components/icon#Icon',
        Logo: '@/components/logo#Logo',
      },
      views: {
        ActivitiesView: {
          Component: '@/components/views/activity/overview#ActivitiesView',
          path: '/activities',
        },
        ActivityBlockView: {
          Component: '@/components/views/activity/view#ActivityBlockView',
          path: '/activity/:id/block/:id',
        },
        FlowBlockView: {
          Component: '@/components/views/flow#FlowBlockView',
          path: '/flow/:id',
        },
        ListBlockView: {
          Component: '@/components/views/list#ListBlockView',
          path: '/list/:id',
        },
      },
    },
    // Payload defaults to 'MMMM do yyyy, h:mm a', which renders an English ordinal and a 12-hour
    // clock in every admin language. Swiss usage is day-first with a 24-hour clock.
    dateFormat: ADMIN_DATE_FORMAT,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [
    Media,
    Organisations,
    Activities,
    Documents,
    DocumentsPublic,
    TaskFlows,
    TaskLists,
    ShareLinks,
    Users,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI || '',
    },
    // Using standalone mode, so we need to make sure the migrations are bundled
    prodMigrations: migrations,
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '',
    defaultFromName: process.env.SMTP_FROM_ADDRESS || '',
    skipVerify: true,
    transportOptions: {
      auth: {
        pass: process.env.SMTP_PASS || '',
        user: process.env.SMTP_USER || '',
      },
      host: process.env.SMTP_HOST || '',
      logger: true,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      transactionLog: true,
    },
  }),
  endpoints: [
    s3OrphanDetectionEndpoint,
    s3OrphanDeleteEndpoint,
    tenantHealthEndpoint,
    processPdfEndpoint,
    parkSearchEndpoint,
    adminStatsEndpoint,
  ],
  globals: [Statistics],
  i18n: {
    fallbackLanguage: 'de',
    supportedLanguages: { de, en, fr, it },
    translations: customI18nTranslations,
  },
  localization: {
    defaultLocale: 'de',
    fallback: true,
    locales: [
      {
        code: 'de',
        label: 'Deutsch',
      },
      {
        code: 'fr',
        label: 'Français',
      },
      {
        code: 'it',
        label: 'Italiano',
      },
    ],
  },
  logger: {
    options: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    },
  },
  async onInit(payload) {
    // The seed creates a super admin with a published password. `isDevelopment` is not
    // enough: it is true for a staging image and for an ops script with NODE_ENV unset.
    if (isLocalDevelopment) {
      await seedDevUser(payload)
    }
  },
  plugins: [
    deepLTranslate({
      apiKey: process.env.DEEPL_API_KEY || '',
      collections: ['activities', 'task-flows', 'task-lists'],
      globals: [],
      trackOutdated: {
        enabled: true,
      },
    }),
    s3Storage({
      bucket: process.env.S3_BUCKET || '',
      collections: {
        [Documents.slug]: { prefix: Documents.slug },
        [DocumentsPublic.slug]: { prefix: DocumentsPublic.slug },
        [Media.slug]: { prefix: Media.slug },
      },
      config: {
        bucketEndpoint: false,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
        // SigV4 signs with this region and the server rejects a mismatch.
        // Garage (local dev) requires 'garage'; R2 and MinIO accept 'auto'.
        region: process.env.S3_REGION || 'auto',
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
  telemetry: false,
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
