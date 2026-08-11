import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverSourceMaps: false,
  },
  output: 'standalone',
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  async redirects() {
    return [
      // The activity landscape is the start page; the Payload dashboard is not used.
      // `source: '/admin'` matches that path exactly — nested routes such as
      // /admin/login or /admin/collections/* are untouched, so there is no loop.
      // Kept non-permanent so reverting does not fight cached 308s in users' browsers.
      {
        destination: '/admin/activities',
        permanent: false,
        source: '/',
      },
      {
        destination: '/admin/activities',
        permanent: false,
        source: '/admin',
      },
    ]
  },
}

export default withPayload(nextConfig)
