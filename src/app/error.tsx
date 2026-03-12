'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { captureException } from '@/lib/observability/error-tracking';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      boundary: 'app',
      component: 'AppErrorPage',
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Ein unerwarteter Fehler ist aufgetreten.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Der Vorfall wurde protokolliert. Sie koennen die Seite erneut laden oder
        zum Produkt zurueckkehren.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Erneut versuchen</Button>
        <Button variant="outline" asChild>
          <Link href="/my-register">Zum Register</Link>
        </Button>
      </div>
    </div>
  );
}
