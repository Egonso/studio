import NextErrorComponent from 'next/error';
import type { ErrorProps } from 'next/error';

// Compatibility fallback for build tools that still probe Pages Router manifests.
export default function CompatibilityError(props: ErrorProps) {
  return <NextErrorComponent {...props} />;
}
