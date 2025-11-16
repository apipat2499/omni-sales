import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
    instrumentationHook: true,
  },
  serverComponentsExternalPackages: [
    'firebase-admin',
    'twilio',
    'google-auth-library',
    '@google-cloud/storage',
  ],

  // PWA Configuration
  // Ensure service worker is served as static file
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  widenClientFileUpload: true,

  // Transpile SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
};

// Export the Sentry-wrapped config
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
