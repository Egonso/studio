'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  MailCheck,
} from 'lucide-react';
import type { Auth } from 'firebase/auth';
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';

import { buildAuthPath } from '@/lib/auth/login-routing';
import { getFirebaseAuth } from '@/lib/firebase';
import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ActionStatus = 'loading' | 'ready' | 'success' | 'error';

function getAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() || 'https://kiregister.com';
}

function isSafeContinuePath(value: string | null): string {
  if (!value) {
    return '/login';
  }

  try {
    const appOrigin = getAppOrigin();
    const parsed = new URL(value, appOrigin);
    if (parsed.origin !== new URL(appOrigin).origin) {
      return '/login';
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (value.startsWith('/') && !value.startsWith('//')) {
      return value;
    }

    return '/login';
  }
}

function getActionModeTitle(mode: string | null): string {
  switch (mode) {
    case 'resetPassword':
      return 'Passwort zurücksetzen';
    case 'recoverEmail':
      return 'E-Mail-Adresse wiederherstellen';
    case 'verifyAndChangeEmail':
      return 'Neue E-Mail-Adresse bestätigen';
    case 'revertSecondFactorAddition':
      return 'Sicherheitsänderung rückgängig machen';
    default:
      return 'E-Mail-Adresse bestätigen';
  }
}

function getActionSuccessCopy(mode: string | null): string {
  switch (mode) {
    case 'recoverEmail':
      return 'Die E-Mail-Adresse wurde wiederhergestellt.';
    case 'verifyAndChangeEmail':
      return 'Die neue E-Mail-Adresse wurde bestätigt.';
    case 'revertSecondFactorAddition':
      return 'Die Sicherheitsänderung wurde rückgängig gemacht.';
    default:
      return 'Die E-Mail-Adresse wurde bestätigt.';
  }
}

function getActionErrorMessage(error: unknown, mode: string | null): string {
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null;

  if (
    code === 'auth/expired-action-code' ||
    code === 'auth/invalid-action-code'
  ) {
    return mode === 'resetPassword'
      ? 'Dieser Link ist ungültig oder bereits abgelaufen. Fordern Sie bitte einen neuen Passwort-Reset an.'
      : 'Dieser Link ist ungültig oder bereits abgelaufen. Fordern Sie bitte eine neue E-Mail an.';
  }

  if (code === 'auth/user-disabled') {
    return 'Dieses Konto ist derzeit deaktiviert.';
  }

  return 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.';
}

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continuePath = isSafeContinuePath(searchParams.get('continueUrl'));

  const [auth, setAuth] = useState<Auth | null>(null);
  const [status, setStatus] = useState<ActionStatus>('loading');
  const [message, setMessage] = useState<string>('Anfrage wird geprüft...');
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    void getFirebaseAuth()
      .then((instance) => {
        if (!isActive) {
          return;
        }
        setAuth(instance);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setStatus('error');
        setMessage('Authentifizierung konnte nicht initialisiert werden.');
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      return;
    }

    if (!oobCode) {
      setStatus('error');
      setMessage('Der Link ist unvollständig.');
      return;
    }

    let isActive = true;

    const run = async () => {
      setStatus('loading');
      setSubmitError(null);

      try {
        if (mode === 'resetPassword') {
          const email = await verifyPasswordResetCode(auth, oobCode);
          if (!isActive) {
            return;
          }
          setResetEmail(email);
          setStatus('ready');
          setMessage('Bitte vergeben Sie jetzt ein neues Passwort.');
          return;
        }

        if (mode === 'recoverEmail') {
          await checkActionCode(auth, oobCode);
        }

        if (
          mode === 'verifyEmail' ||
          mode === 'verifyAndChangeEmail' ||
          mode === 'recoverEmail' ||
          mode === 'revertSecondFactorAddition'
        ) {
          await applyActionCode(auth, oobCode);
          await auth.currentUser?.reload().catch(() => undefined);

          if (!isActive) {
            return;
          }

          setStatus('success');
          setMessage(getActionSuccessCopy(mode));
          return;
        }

        setStatus('error');
        setMessage('Dieser Linktyp wird derzeit nicht unterstützt.');
      } catch (error) {
        if (!isActive) {
          return;
        }
        setStatus('error');
        setMessage(getActionErrorMessage(error, mode));
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [auth, mode, oobCode]);

  async function handleResetPasswordSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!auth || !oobCode) {
      setSubmitError('Der Reset-Link ist unvollständig.');
      return;
    }

    if (newPassword.length < 6) {
      setSubmitError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setMessage('Das Passwort wurde erfolgreich aktualisiert.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSubmitError(getActionErrorMessage(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginHref =
    continuePath === '/login'
      ? buildAuthPath({ mode: 'login' })
      : continuePath;

  const heading = getActionModeTitle(mode);

  return (
    <MarketingShell>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-10 flex items-center gap-3 border-b border-slate-200 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt="KI-Register"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>KI-Register</span>
          </Link>
        </header>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Authentifizierung
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {heading}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              KI Register verarbeitet diese Anfrage direkt über den gesendeten Sicherheitslink.
            </p>
          </div>

          <div className="px-6 py-8">
            {status === 'loading' ? (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{message}</span>
              </div>
            ) : null}

            {status === 'ready' && mode === 'resetPassword' ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-950">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-950">
                      Neues Passwort vergeben
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      {resetEmail
                        ? `Für ${resetEmail} kann jetzt ein neues Passwort gesetzt werden.`
                        : message}
                    </p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-950"
                      htmlFor="auth-action-password"
                    >
                      Neues Passwort
                    </label>
                    <Input
                      id="auth-action-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-950"
                      htmlFor="auth-action-password-confirm"
                    >
                      Passwort wiederholen
                    </label>
                    <Input
                      id="auth-action-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>

                  {submitError ? (
                    <p className="text-sm text-slate-900">{submitError}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Speichert...
                        </>
                      ) : (
                        'Passwort aktualisieren'
                      )}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={buildAuthPath({ mode: 'login' })}>
                        Zur Anmeldung
                      </Link>
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}

            {status === 'success' ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-950">
                    {mode === 'resetPassword' ? (
                      <KeyRound className="h-4 w-4" />
                    ) : (
                      <MailCheck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-950">
                      Erfolgreich abgeschlossen
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{message}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={loginHref}>
                      {mode === 'resetPassword'
                        ? 'Weiter zur Anmeldung'
                        : 'Anmeldung öffnen'}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Zur Startseite</Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-950">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-950">
                      Link konnte nicht verarbeitet werden
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{message}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={buildAuthPath({ mode: 'login' })}>
                      Zur Anmeldung
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Zur Startseite</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
