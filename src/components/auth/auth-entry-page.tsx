'use client';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { TeamShareStep } from '@/components/onboarding/team-share-step';
import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { buildBillingWelcomePath } from '@/lib/billing/post-checkout';
import type { SubscriptionPlan } from '@/lib/register-first/types';
import {
  authenticateWithEmailPassword,
  completeRegisterSetup,
  getAuthErrorDescription,
  loadAuthClient,
  resolveAuthenticatedDestination,
  sendPasswordReset,
  validateJoinCode,
  type AuthEntryContext,
  type JoinCodeValidationSuccess,
} from '@/lib/auth/auth-entry-controller';
import {
  buildAuthPath,
  getInitialAuthIntent,
  getInitialAuthMode,
  readLoginRouteOptions,
  type AuthIntent,
  type AuthMode,
} from '@/lib/auth/login-routing';

type CreateStep = 1 | 2 | 3;
type JoinStep = 'code' | 'confirm' | 'signup';
type CopyTarget = 'code' | 'link' | null;

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

interface CheckoutReturnContext {
  claimable: boolean;
  emailHint: string | null;
  plan: SubscriptionPlan | null;
  status: 'idle' | 'loaded' | 'error';
}

interface ContextNotice {
  description: string;
  id: string;
  title: string;
}

function getContextNotices(
  context: ReturnType<typeof readLoginRouteOptions>,
  mode: AuthMode,
  intent: AuthIntent,
  checkoutContext: CheckoutReturnContext,
): ContextNotice[] {
  const notices: ContextNotice[] = [];
  void checkoutContext;

  if (context.workspaceInvite) {
    notices.push({
      id: 'workspace_invite',
      title: 'Invitation detected',
      description:
        'After signing in, we will open the shared workspace directly.',
    });
  }

  if (context.importUseCase) {
    notices.push({
      id: 'import_use_case',
      title: 'Continue process',
      description: 'You will continue right where you left off.',
    });
  }

  if (context.code && mode === 'login') {
    notices.push({
      id: 'join_after_login',
      title: 'Invitation code detected',
      description:
        'After signing in, you can join your organisation directly.',
    });
  }

  if (context.code && mode === 'signup' && intent === 'join_register') {
    notices.push({
      id: 'join_context',
      title: 'Preparing to join',
      description:
        'After registration, you will continue joining directly.',
    });
  }

  return notices;
}

function getSuccessDescription(
  plan: SubscriptionPlan | null,
  baseDescription: string,
): string {
  if (plan === 'pro' || plan === 'enterprise') {
    return 'Governance Control Centre will be activated for this account.';
  }

  return baseDescription;
}

export default function AuthEntryPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { loading: authLoading, user } = useAuth();

  const routeContext = useMemo(
    () => readLoginRouteOptions(searchParams),
    [searchParams],
  );

  const [mode, setMode] = useState<AuthMode>(() =>
    getInitialAuthMode(routeContext),
  );
  const [intent, setIntent] = useState<AuthIntent>(() =>
    getInitialAuthIntent(routeContext),
  );

  const [authReady, setAuthReady] = useState(false);
  const [authInitError, setAuthInitError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [checkoutContext, setCheckoutContext] = useState<CheckoutReturnContext>(
    {
      claimable: false,
      emailHint: null,
      plan: null,
      status: 'idle',
    },
  );

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [organisationName, setOrganisationName] = useState('');
  const [organisationRole, setOrganisationRole] = useState(
    'AI Responsible Person',
  );
  const [shareInviteCode, setShareInviteCode] = useState('');
  const [shareCaptureLink, setShareCaptureLink] = useState('');
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget>(null);
  const [createdRegisterId, setCreatedRegisterId] = useState<string | null>(
    null,
  );

  const [joinStep, setJoinStep] = useState<JoinStep>('code');
  const [joinCodeInput, setJoinCodeInput] = useState(routeContext.code ?? '');
  const [validatedJoin, setValidatedJoin] =
    useState<JoinCodeValidationSuccess | null>(null);
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const autoValidatedCodeRef = useRef<string | null>(null);

  const hasExplicitAuthContext = Boolean(
    routeContext.mode ||
      routeContext.intent ||
      routeContext.code ||
      routeContext.returnTo ||
      routeContext.workspaceInvite ||
      routeContext.importUseCase ||
      routeContext.sessionId,
  );

  useEffect(() => {
    let cancelled = false;

    loadAuthClient()
      .then(() => {
        if (!cancelled) {
          setAuthReady(true);
          setAuthInitError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to initialize Firebase Auth client', error);
          setAuthReady(false);
          setAuthInitError(
            t('auth.errors.authUnavailable'),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMode(getInitialAuthMode(routeContext));
    setIntent(getInitialAuthIntent(routeContext));
    setShowForgotPassword(false);
  }, [routeContext]);

  useEffect(() => {
    if (!routeContext.email) {
      return;
    }

    const normalized = routeContext.email.toLowerCase();
    setLoginEmail((current) => current || normalized);
    setCreateEmail((current) => current || normalized);
    setJoinEmail((current) => current || normalized);
    setResetEmail((current) => current || normalized);
  }, [routeContext.email]);

  useEffect(() => {
    if (!routeContext.code) {
      return;
    }

    setJoinCodeInput(routeContext.code.toUpperCase());
  }, [routeContext.code]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setCreateName((current) => current || user.displayName || '');
    setCreateEmail((current) => current || user.email?.toLowerCase() || '');
    setJoinEmail((current) => current || user.email?.toLowerCase() || '');
    setJoinName((current) => current || user.displayName || '');

    if (intent === 'create_register' && createStep === 1) {
      setCreateStep(2);
    }
  }, [createStep, intent, user]);

  useEffect(() => {
    if (!routeContext.sessionId) {
      setCheckoutContext({
        claimable: false,
        emailHint: null,
        plan: null,
        status: 'idle',
      });
      return;
    }

    let cancelled = false;

    fetch(
      `/api/stripe-session?session_id=${encodeURIComponent(routeContext.sessionId)}`,
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Checkout context failed.',
          );
        }
        return data;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setCheckoutContext({
          claimable: data.checkout_claimable === true,
          emailHint:
            typeof data.customer_email_hint === 'string'
              ? data.customer_email_hint
              : null,
          plan:
            data.entitlement_plan === 'pro' ||
            data.entitlement_plan === 'enterprise'
              ? data.entitlement_plan
              : null,
          status: 'loaded',
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch checkout session context', error);
          setCheckoutContext({
            claimable: false,
            emailHint: null,
            plan: null,
            status: 'error',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeContext.email, routeContext.sessionId]);

  const handleValidateJoinCode = useCallback(async (rawCode?: string) => {
    setBusyAction('validate_join_code');
    const result = await validateJoinCode(rawCode ?? joinCodeInput);

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: result.error.title,
        description: result.error.description,
      });
      setBusyAction(null);
      return;
    }

    setValidatedJoin(result);
    setJoinCodeInput(result.code);
    setJoinStep('confirm');
    setBusyAction(null);
  }, [joinCodeInput, toast]);

  useEffect(() => {
    if (
      authLoading ||
      !authReady ||
      mode !== 'signup' ||
      intent !== 'join_register' ||
      !routeContext.code ||
      joinStep !== 'code'
    ) {
      return;
    }

    if (autoValidatedCodeRef.current === routeContext.code) {
      return;
    }

    autoValidatedCodeRef.current = routeContext.code;

    void handleValidateJoinCode(routeContext.code);
  }, [
    authLoading,
    authReady,
    handleValidateJoinCode,
    intent,
    joinStep,
    mode,
    routeContext.code,
  ]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    if (!hasExplicitAuthContext) {
      router.replace('/my-register');
      return;
    }

    if (
      routeContext.mode === 'login' &&
      !routeContext.code &&
      !routeContext.importUseCase &&
      !routeContext.returnTo &&
      !routeContext.sessionId &&
      !routeContext.workspaceInvite
    ) {
      router.replace('/my-register');
    }
  }, [authLoading, hasExplicitAuthContext, routeContext, router, user]);

  const contextNotices = useMemo(
    () => getContextNotices(routeContext, mode, intent, checkoutContext),
    [checkoutContext, intent, mode, routeContext],
  );

  const authContext: AuthEntryContext = useMemo(
    () => ({
      ...routeContext,
      intent,
      mode,
    }),
    [intent, mode, routeContext],
  );

  function updateAuthRoute(nextMode: AuthMode, nextIntent: AuthIntent = intent) {
    setMode(nextMode);
    setIntent(nextIntent);
    startTransition(() => {
      router.replace(
        buildAuthPath({
          ...routeContext,
          intent: nextMode === 'login' ? nextIntent : nextIntent,
          mode: nextMode,
        }),
      );
    });
  }

  function switchIntent(nextIntent: AuthIntent) {
    setIntent(nextIntent);
    if (nextIntent === 'create_register') {
      setJoinStep('code');
    }
    startTransition(() => {
      router.replace(
        buildAuthPath({
          ...routeContext,
          intent: nextIntent,
          mode: 'signup',
        }),
      );
    });
  }

  async function handlePasswordReset() {
    const targetEmail = resetEmail || loginEmail;

    if (!targetEmail.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.enterEmail'),
      });
      return;
    }

    setIsResetting(true);

    try {
      await sendPasswordReset(targetEmail);
    } catch {
      // Intentionally swallow auth existence/config details.
    } finally {
      toast({
        title: t('auth.resetEmailSent'),
        description: t('auth.resetEmailSentDesc'),
      });
      setIsResetting(false);
      setShowForgotPassword(false);
    }
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.enterEmailPassword'),
      });
      return;
    }

    if (!authReady || authInitError) {
      toast({
        variant: 'destructive',
        title: t('auth.errors.authNotReady'),
        description:
          authInitError ??
          t('auth.errors.authInitializing'),
      });
      return;
    }

    setBusyAction('login');

    try {
      const result = await authenticateWithEmailPassword({
        action: 'login',
        context: authContext,
        email: loginEmail,
        password: loginPassword,
      });

      if (result.requiresEmailVerification) {
        toast({
          title: t('auth.emailVerificationRequired'),
          description: t('auth.emailVerificationDesc'),
        });
        setLoginPassword('');
        return;
      }

      const destination = await resolveAuthenticatedDestination({
        context: authContext,
        email: loginEmail,
        syncNeedsRegister: result.syncNeedsRegister,
      });

      toast({
        title: t('auth.loginSuccess'),
        description: destination.startsWith('/?')
          ? 'Please complete your register setup on the same page now.'
          : getSuccessDescription(result.syncedPlan, t('auth.loginSuccessRedirect')),
      });

      setLoginPassword('');
      router.push(destination);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: getAuthErrorDescription(error, 'login'),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.fillAllFields'),
      });
      return;
    }

    if (createPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.passwordTooShort'),
      });
      return;
    }

    if (!authReady || authInitError) {
      toast({
        variant: 'destructive',
        title: t('auth.errors.authNotReady'),
        description:
          authInitError ??
          t('auth.errors.authInitializing'),
      });
      return;
    }

    setBusyAction('create_account');

    try {
      const result = await authenticateWithEmailPassword({
        action: 'signup',
        context: {
          ...authContext,
          intent: 'create_register',
          mode: 'signup',
        },
        displayName: createName,
        email: createEmail,
        password: createPassword,
      });

      if (result.requiresEmailVerification) {
        toast({
          title: t('auth.pleaseConfirmEmail'),
          description: t('auth.emailVerificationDesc'),
        });
        setCreatePassword('');
        return;
      }

      toast({
        title: t('auth.accountCreated'),
        description: getSuccessDescription(
          result.syncedPlan,
          'Only the organisation step for your register remains.',
        ),
      });
      setCreateStep(2);
      setCreatePassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: getAuthErrorDescription(error, 'signup'),
      });

      if (error?.code === 'auth/email-already-in-use') {
        updateAuthRoute('login', 'create_register');
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRegisterSetup(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!organisationName.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.enterOrgName'),
      });
      return;
    }

    const contactName = createName.trim() || user?.displayName?.trim() || '';
    const contactEmail =
      createEmail.trim().toLowerCase() || user?.email?.toLowerCase() || '';

    if (!contactEmail) {
      toast({
        variant: 'destructive',
        title: 'Fehlende E-Mail-Adresse',
        description:
          'Bitte melden Sie sich erneut an oder legen Sie das Konto neu an.',
      });
      return;
    }

    setBusyAction('register_setup');

    try {
      const result = await completeRegisterSetup({
        contactEmail,
        contactName,
        importUseCase: routeContext.importUseCase,
        organisationName,
        role: organisationRole,
        sessionId: routeContext.sessionId,
      });

      if (
        routeContext.sessionId &&
        (result.syncedPlan === 'pro' || result.syncedPlan === 'enterprise')
      ) {
        router.push(
          buildBillingWelcomePath(routeContext.sessionId, {
            source: 'checkout',
            first_run: true,
          }),
        );
        return;
      }

      setShareInviteCode(result.inviteCode);
      setShareCaptureLink(result.captureLink);
      setCreatedRegisterId(result.registerId);
      setCreateStep(3);

      toast({
        title: result.existingRegisterUsed
          ? t('landing.existingRegisterUsed')
          : 'Register eingerichtet',
        description: result.importedUseCase
          ? 'The register is ready and the import has been applied.'
          : getSuccessDescription(
              result.syncedPlan,
              'The register is ready. You can get started right away.',
            ),
      });
    } catch (error) {
      console.error('Register setup failed', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.registerSetupFailed'),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleJoinSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validatedJoin) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.checkInviteCode'),
      });
      setJoinStep('code');
      return;
    }

    if (!joinName.trim() || !joinEmail.trim() || !joinPassword.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.fillAllFields'),
      });
      return;
    }

    if (joinPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.errors.passwordTooShort'),
      });
      return;
    }

    if (!authReady || authInitError) {
      toast({
        variant: 'destructive',
        title: t('auth.errors.authNotReady'),
        description:
          authInitError ??
          t('auth.errors.authInitializing'),
      });
      return;
    }

    setBusyAction('join_signup');

    try {
      const result = await authenticateWithEmailPassword({
        action: 'signup',
        context: {
          ...authContext,
          code: validatedJoin.code,
          intent: 'join_register',
          mode: 'signup',
        },
        displayName: joinName,
        email: joinEmail,
        password: joinPassword,
      });

      if (result.requiresEmailVerification) {
        toast({
          title: t('auth.pleaseConfirmEmail'),
          description: t('auth.emailVerificationDesc'),
        });
        setJoinPassword('');
        return;
      }

      toast({
        title: 'Zugang angelegt',
        description: 'Leite direkt in die Erfassung Ihrer Organisation weiter.',
      });
      setJoinPassword('');
      router.push(`/erfassen?code=${encodeURIComponent(validatedJoin.code)}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: getAuthErrorDescription(error, 'signup'),
      });

      if (error?.code === 'auth/email-already-in-use') {
        updateAuthRoute('login', 'join_register');
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function copyValue(
    value: string,
    target: Exclude<CopyTarget, null>,
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('landing.copyFailed'),
      });
    }
  }

  function handleShareContinue() {
    if (createdRegisterId) {
      setCreatedRegisterId(createdRegisterId);
    }
    router.push('/my-register?onboarding=true');
  }

  const isBusy = (key: string) => busyAction === key;

  const authPanelTitle =
    mode === 'login'
      ? t('auth.signIn')
      : intent === 'join_register'
        ? t('auth.joinRegister')
        : t('auth.setupRegister');

  const authPanelDescription =
    mode === 'login'
      ? 'Melden Sie sich mit Ihrem bestehenden Zugang an und setzen Sie direkt fort.'
      : intent === 'join_register'
        ? 'Validate the invitation code first, then create your account.'
        : createStep === 1
          ? t('auth.step1')
          : createStep === 2
            ? t('auth.step2')
            : t('auth.step3');

  return (
    <MarketingShell>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        <div className="mb-10 flex items-center gap-3">
          <ThemeAwareLogo
            alt="KI-Register"
            width={34}
            height={34}
            className="h-8 w-auto"
          />
          <p className="text-base font-semibold tracking-tight text-slate-950">
            {t('metadata.appName')}
          </p>
        </div>

        <section className="space-y-6 pb-10">
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            Every organisation using AI maintains an AI register.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Ein KI-Register ist die organisationsinterne Standard-Struktur zur
            documentation of AI use cases. It records responsibilities,
            status, and evidence in an auditable form as required by the EU
            AI Act fordert.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/downloads"
              className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
            >
              {t('nav.downloads')}
            </Link>
            <a
              href={WHITEPAPER_HREF}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
            >
              Whitepaper herunterladen
            </a>
          </div>
        </section>

        <section className="space-y-5 border-t border-slate-200 py-8">
          <div className="flex gap-4">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-950">
                Verantwortung zuordnen
              </p>
              <p className="text-base leading-7 text-slate-600">
                Every AI use case has a responsible role. No
                use cases without an owner.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-950">
                Document status and review state
              </p>
              <p className="text-base leading-7 text-slate-600">
                From draft to formal review, every state is
                nachvollziehbar.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="mt-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
            <div className="space-y-1">
              <p className="text-base font-medium text-slate-950">
                Nachweise erzeugen und exportieren
              </p>
              <p className="text-base leading-7 text-slate-600">
                Use case pass as PDF and JSON. Standardised. Audit-ready.
                Teilbar.
              </p>
            </div>
          </div>
        </section>

        {contextNotices.length > 0 ? (
          <div className="mb-6 space-y-3">
            {contextNotices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-md border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-950">{notice.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{notice.description}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="w-full">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="space-y-4">
              <Tabs
                value={mode}
                onValueChange={(value) =>
                  updateAuthRoute(value as AuthMode, intent)
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('auth.signInTab')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <CardTitle className="text-xl tracking-tight text-slate-950">
                  {authPanelTitle}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  {authPanelDescription}
                </CardDescription>
              </div>

              {mode === 'signup' ? (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => switchIntent('create_register')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      intent === 'create_register'
                        ? 'bg-white text-slate-950'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {t('auth.setupRegister')}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchIntent('join_register')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      intent === 'join_register'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {t('auth.joinRegister')}
                  </button>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
                {!authReady && !authInitError ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.errors.authInitializing')}
                    </div>
                  </div>
                ) : null}

                {authInitError ? (
                  <div className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {authInitError}
                  </div>
                ) : null}

                {mode === 'login' ? (
                  <div className="space-y-4">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-slate-900"
                          htmlFor="login-email"
                        >
                          {t('auth.email')}
                        </label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(event) => setLoginEmail(event.target.value)}
                          placeholder="ihre@organisation.de"
                          autoComplete="email"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-slate-900"
                          htmlFor="login-password"
                        >
                          {t('auth.password')}
                        </label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(event) =>
                            setLoginPassword(event.target.value)
                          }
                          placeholder="Mindestens 6 Zeichen"
                          autoComplete="current-password"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={Boolean(busyAction) || !authReady}
                      >
                        {isBusy('login') ? t('auth.signingIn') : t('auth.signIn')}
                      </Button>
                    </form>

                    <div className="space-y-2 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setShowForgotPassword((current) => !current);
                        }}
                        className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
                      >
                        {t('auth.forgotPassword')}
                      </button>

                      {showForgotPassword ? (
                        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <Input
                            type="email"
                            value={resetEmail}
                            onChange={(event) =>
                              setResetEmail(event.target.value)
                            }
                            placeholder="ihre@organisation.de"
                            autoComplete="email"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                          >
                            {isResetting ? t('common.pleaseWait') : t('auth.sendResetLink')}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {mode === 'signup' && intent === 'create_register' ? (
                  <div className="space-y-5">
                    {createStep === 1 ? (
                      <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="create-name"
                          >
                            {t('common.nameLabel')}
                          </label>
                          <Input
                            id="create-name"
                            value={createName}
                            onChange={(event) => setCreateName(event.target.value)}
                            placeholder="Ihr Name"
                            autoComplete="name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="create-email"
                          >
                            {t('auth.email')}
                          </label>
                          <Input
                            id="create-email"
                            type="email"
                            value={createEmail}
                            onChange={(event) => setCreateEmail(event.target.value)}
                            placeholder="ihre@organisation.de"
                            autoComplete="email"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="create-password"
                          >
                            {t('auth.password')}
                          </label>
                          <Input
                            id="create-password"
                            type="password"
                            value={createPassword}
                            onChange={(event) =>
                              setCreatePassword(event.target.value)
                            }
                            placeholder="Mindestens 6 Zeichen"
                            autoComplete="new-password"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={Boolean(busyAction) || !authReady}
                        >
                          {isBusy('create_account')
                            ? t('common.pleaseWait')
                            : t('common.next')}
                        </Button>
                      </form>
                    ) : null}

                    {createStep === 2 ? (
                      <form onSubmit={handleRegisterSetup} className="space-y-4">
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="organisation-name"
                          >
                            {t('auth.organisationName')}
                          </label>
                          <Input
                            id="organisation-name"
                            value={organisationName}
                            onChange={(event) =>
                              setOrganisationName(event.target.value)
                            }
                            placeholder="z. B. Mustermann GmbH"
                            autoComplete="organization"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="organisation-role"
                          >
                            {t('landing.roleLabel')} <span className="text-slate-500">({t('common.optional')})</span>
                          </label>
                          <Input
                            id="organisation-role"
                            value={organisationRole}
                            onChange={(event) =>
                              setOrganisationRole(event.target.value)
                            }
                            placeholder="z. B. AI Responsible Person"
                          />
                        </div>

                        <p className="text-xs leading-5 text-slate-500">
                          {t('landing.orgExistsNote')}
                        </p>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={Boolean(busyAction)}
                        >
                          {isBusy('register_setup')
                            ? t('common.pleaseWait')
                            : t('auth.setUpRegister')}
                        </Button>
                      </form>
                    ) : null}

                    {createStep === 3 ? (
                      <TeamShareStep
                        inviteCode={shareInviteCode}
                        captureLink={shareCaptureLink}
                        copiedTarget={copiedTarget}
                        onCopyValue={copyValue}
                        onContinue={handleShareContinue}
                      />
                    ) : null}
                  </div>
                ) : null}

                {mode === 'signup' && intent === 'join_register' ? (
                  <div className="space-y-5">
                    {joinStep === 'code' ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleValidateJoinCode();
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="join-code"
                          >
                            {t('auth.invitationCode')}
                          </label>
                          <Input
                            id="join-code"
                            value={joinCodeInput}
                            onChange={(event) =>
                              setJoinCodeInput(event.target.value.toUpperCase())
                            }
                            placeholder="AI-XXXXXX"
                            className="font-mono tracking-wider"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={Boolean(busyAction)}
                        >
                          {isBusy('validate_join_code') ? t('common.pleaseWait') : t('common.verify')}
                        </Button>
                      </form>
                    ) : null}

                    {joinStep === 'confirm' && validatedJoin ? (
                      <div className="space-y-4">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-medium text-slate-950">
                            {validatedJoin.organisationName ??
                              validatedJoin.label ??
                              'Organisation'}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            Code: {validatedJoin.code}
                          </p>
                        </div>

                        {user ? (
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() =>
                              router.push(
                                `/erfassen?code=${encodeURIComponent(
                                  validatedJoin.code,
                                )}`,
                              )
                            }
                          >
                            Direkt zur Erfassung
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setJoinStep('signup')}
                          >
                            {t('auth.createAccount')}
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setJoinStep('code');
                            setValidatedJoin(null);
                          }}
                          className="w-full text-center text-xs text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline"
                        >
                          {t('auth.notMyOrganisation')}
                        </button>
                      </div>
                    ) : null}

                    {joinStep === 'signup' && validatedJoin ? (
                      <form onSubmit={handleJoinSignup} className="space-y-4">
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="join-name"
                          >
                            {t('common.nameLabel')}
                          </label>
                          <Input
                            id="join-name"
                            value={joinName}
                            onChange={(event) => setJoinName(event.target.value)}
                            placeholder="Ihr Name"
                            autoComplete="name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="join-email"
                          >
                            {t('auth.email')}
                          </label>
                          <Input
                            id="join-email"
                            type="email"
                            value={joinEmail}
                            onChange={(event) => setJoinEmail(event.target.value)}
                            placeholder="ihre@organisation.de"
                            autoComplete="email"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="join-password"
                          >
                            {t('auth.password')}
                          </label>
                          <Input
                            id="join-password"
                            type="password"
                            value={joinPassword}
                            onChange={(event) =>
                              setJoinPassword(event.target.value)
                            }
                            placeholder="Mindestens 6 Zeichen"
                            autoComplete="new-password"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={Boolean(busyAction) || !authReady}
                        >
                          {isBusy('join_signup')
                            ? t('common.pleaseWait')
                            : t('auth.continueToCapture')}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}

            </CardContent>
          </Card>

          <div className="space-y-2 px-1 pt-5 text-sm">
            {mode !== 'signup' || intent !== 'join_register' ? (
              <button
                type="button"
                onClick={() => updateAuthRoute('signup', 'join_register')}
                className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
              >
                {t('auth.useInvitationCode')}
              </button>
            ) : null}
            {mode !== 'signup' || intent !== 'create_register' ? (
              <button
                type="button"
                onClick={() => updateAuthRoute('signup', 'create_register')}
                className="block text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
              >
                {t('auth.setUpRegister')}
              </button>
            ) : null}
          </div>
        </div>

        <section className="space-y-2 border-t border-slate-200 pt-6">
          <p className="text-sm leading-6 text-slate-600">
            Privat und organisationsintern. Ihre Daten bleiben in Ihrer
            Registerinstanz.
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Evidence and register extracts can be shared in a standardised format.
          </p>
        </section>

      </main>
    </MarketingShell>
  );
}
