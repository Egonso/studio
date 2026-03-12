import type { NextConfig } from 'next';
import { LEGACY_ROUTE_REDIRECTS } from './src/lib/navigation/route-manifest';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_DOCUMENTERO_API_KEY:
      process.env.NEXT_PUBLIC_DOCUMENTERO_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/googleai',
    '@genkit-ai/firebase',
    'handlebars',
  ],
  async redirects() {
    return LEGACY_ROUTE_REDIRECTS;
  },
};

export default nextConfig;
