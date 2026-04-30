'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface FortbildungCheckoutButtonProps {
  className: string;
  label: string;
  locale: string;
  pendingLabel: string;
  testId: string;
}

export function FortbildungCheckoutButton({
  className,
  label,
  locale,
  pendingLabel,
  testId,
}: FortbildungCheckoutButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/fortbildung/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: locale === 'en' ? 'en' : 'de' }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || typeof payload.url !== 'string') {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Checkout konnte gerade nicht gestartet werden.',
        );
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setState('error');
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Checkout konnte gerade nicht gestartet werden.',
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        data-testid={testId}
        className={className}
        disabled={state === 'loading'}
        onClick={() => void startCheckout()}
      >
        {state === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {pendingLabel}
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {state === 'error' && error ? (
        <p className="mt-3 text-xs leading-6 text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
