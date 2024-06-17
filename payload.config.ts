import path from 'path';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload/config';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { en } from '@payloadcms/translations/languages/en';
import { de } from '@payloadcms/translations/languages/de';
import { s3Storage } from '@payloadcms/storage-s3';
import nodemailer from 'nodemailer';
import { nodemailerAdapter } from '@/config/nodemailerAdapter';
import { seedDevUser } from '@/config/seed/dev-user';
import { Collections } from '@/payload/collections';
import { docsReorder } from '@payload-enchants/docs-reorder';
import { translator } from '@payload-enchants/translator';
import { copyResolver } from '@payload-enchants/translator/resolvers/copy';
import { openAIResolver } from '@payload-enchants/translator/resolvers/openAI';
import { fr } from '@payloadcms/translations/languages/fr';
import { it } from '@payloadcms/translations/languages/it';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),
  collections: [...Collections],
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
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI || '',
    },
  }),

  /**
   * Payload can now accept specific translations from 'payload/i18n/en'
   * This is completely optional and will default to English if not provided
   */
  i18n: {
    supportedLanguages: { en, de, fr, it },
  },
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
    components: {},
  },
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || '',
    defaultFromName: 'Payload',
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
    docsReorder({
      collections: [{ slug: 'categories' }], // The feature will be enabled only for collections that are in this array.,
    }),
    translator({
      // collections with the enabled translator in the admin UI
      collections: ['product', 'categories'],
      // globals with the enabled translator in the admin UI
      globals: [],
      // add resolvers that you want to include, examples on how to write your own in ./plugin/src/resolvers
      resolvers: [
        copyResolver(),
        openAIResolver({
          apiKey: process.env.OPENAI_KEY || '',
          model: 'gpt-4',
        }),
      ],
    }),
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
