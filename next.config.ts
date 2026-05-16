import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/admin/users',
        destination: '/admin/collections/users',
        permanent: false,
      },
      {
        source: '/event/:eventSlug',
        destination: '/events/:eventSlug',
        permanent: false,
      },
      {
        source: '/event/:eventSlug/channel/:channelSlug',
        destination: '/events/:eventSlug/channels/:channelSlug',
        permanent: false,
      },
      {
        source: '/listener/:eventSlug/:channelSlug',
        destination: '/listen/:eventSlug/:channelSlug',
        permanent: false,
      },
      {
        source: '/speaker/:eventSlug/:channelSlug',
        destination: '/speak/:eventSlug/:channelSlug',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [],
    localPatterns: [
      {
        pathname: '/undersound-logo.png',
      },
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
