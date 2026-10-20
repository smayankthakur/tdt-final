/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // nodemailer is server-only; keep it out of the bundler.
  serverExternalPackages: ['nodemailer'],
  async redirects() {
    return [
      // Paths that existed on the separate sites, now living under one roof.
      { source: '/course', destination: '/courses', permanent: true },
      { source: '/learn', destination: '/courses', permanent: true },
      { source: '/booking', destination: '/personal-reading', permanent: true },
      { source: '/book', destination: '/personal-reading', permanent: true },
      { source: '/form', destination: '/personal-reading/form', permanent: true },
      { source: '/chat', destination: '/reading', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
      { source: '/refund', destination: '/refund-policy', permanent: true },
    ];
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'sitelytc-digital-media',
  project: process.env.SENTRY_PROJECT || 'sentry-bisque-branch',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
});
