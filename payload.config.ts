import path from 'path';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { en } from '@payloadcms/translations/languages/en';
import { de } from '@payloadcms/translations/languages/de';
import { s3Storage } from '@payloadcms/storage-s3';
import nodemailer from 'nodemailer';
import { nodemailerAdapter } from '@/config/nodemailerAdapter';
import { seedDevUser } from '@/config/seed/dev-user';
import { fr } from '@payloadcms/translations/languages/fr';
import { it } from '@payloadcms/translations/languages/it';
import { Users } from '@/payload/collections/Users';
import { buildConfig } from 'payload';
import { OrganisationSelect } from '@/admin-components/organisation-select';
import { Activities } from '@/payload/collections/Activities';
import { TaskFlows } from 'src/payload/collections/TaskFlow';
import { Media } from '@/payload/collections/Media';
import { Organisations } from '@/payload/collections/Organisations';
import { Documents } from '@/payload/collections/Documents';
import { ActivityLandscapeLink } from '@/admin-components/activity/activity-landscape-link';
import { ActivitiesView } from '@/admin-components/activity/overview';
import { customI18nTranslations } from '@/lib/custom-i18n-translations';
import { TaskLists } from '@/payload/collections/TaskList';
import { ActivityBlockView } from '@/admin-components/activity/view';
import { FlowBlockView } from '@/admin-components/flow';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),
  collections: [Media, Organisations, Activities, Documents, TaskFlows, TaskLists, Users],
  globals: [],
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Deutsch',
        code: 'de',
      },
      {
        label: 'Français',
        code: 'fr',
      },
      {
        label: 'Italiano',
        code: 'it',
      },
    ],
    defaultLocale: 'de',
    fallback: true,
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, de, fr, it },
    translations: customI18nTranslations,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'src', 'types', 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI || '',
    },
  }),
  admin: {
    ...(process.env.NODE_ENV !== 'production'
      ? {
          autoLogin: {
            email: 'admin@test.com',
            password: 'admin',
            prefillOnly: true,
          },
        }
      : {}),
    components: {
      beforeNavLinks: [ActivityLandscapeLink, OrganisationSelect],
      views: {
        FlowBlockView: {
          path: '/activity/:id/flow/:id',
          Component: FlowBlockView,
        },
        ActivityBlockView: {
          path: '/activity/:id/block/:id',
          Component: ActivityBlockView,
        },
        ActivitiesView: {
          path: '/activities',
          Component: ActivitiesView,
        },
      },
    },
    user: Users.slug,
  },
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '',
    defaultFromName: process.env.SMTP_FROM_ADDRESS || '',
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST || '',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }),
  }),
  async onInit(payload) {
    await seedDevUser(payload);
  },
  plugins: [
    // https://github.com/r1tsuu/payload-enchants/tree/master/packages/docs-reorder
    // docsReorder({
    //   collections: [{ slug: Activities.slug }],
    // }),
    // translator({
    //   // collections with the enabled translator in the admin UI
    //   collections: ['activities', 'task-flows', 'media', 'documents'],
    //   // globals with the enabled translator in the admin UI
    //   globals: [],
    //   // add resolvers that you want to include, examples on how to write your own in ./plugin/src/resolvers
    //   resolvers: [
    //     copyResolver(),
    //     openAIResolver({
    //       apiKey: process.env.OPENAI_KEY || '',
    //       model: 'gpt-4',
    //     }),
    //   ],
    // }),
    // betterLocalizedFields(),
    s3Storage({
      collections: { media: true, 'product-media': true },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        bucketEndpoint: false,
        forcePathStyle: true,
        region: 'auto', // Cloudflare R2 specific
        endpoint: process.env.S3_ENDPOINT || '',
      },
      bucket: process.env.S3_BUCKET || '',
    }),
  ],
  telemetry: false,
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
});
