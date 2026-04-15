import type { AppProps } from 'next/app';

// Compatibility fallback for build tools that still probe Pages Router manifests.
export default function CompatibilityApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
