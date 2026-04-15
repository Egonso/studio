import {
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

// Compatibility fallback for build tools that still probe Pages Router manifests.
export default function CompatibilityDocument() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
