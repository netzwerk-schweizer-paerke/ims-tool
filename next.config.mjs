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
      {
        destination: '/admin',
        permanent: false,
        source: '/',
      },
    ]
  },
}

export default withPayload(nextConfig)
