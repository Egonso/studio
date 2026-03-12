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
    <html lang="de">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Das Produkt konnte nicht geladen werden.
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Der Fehler wurde protokolliert. Versuchen Sie es erneut oder starten
          Sie auf der Startseite.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => reset()}>Neu laden</Button>
          <Button variant="outline" asChild>
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
