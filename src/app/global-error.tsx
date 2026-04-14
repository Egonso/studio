'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { captureException } from '@/lib/observability/error-tracking';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      boundary: 'global',
      component: 'GlobalErrorPage',
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          The application could not be loaded.
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The error has been logged. Please try again or return to the home
          page.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => reset()}>Reload</Button>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
