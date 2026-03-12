'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { useToast } from '@/hooks/use-toast';
import {
  buildLoginPath,
  getInitialLoginMode,
  readLoginRouteOptions,
  type LoginMode,
  type LoginRouteOptions,
} from '@/lib/auth/login-routing';

const formSchema = z.object({
  email: z.string().email({
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  }),
  password: z.string().min(6, {
    message: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface ContextNotice {
  id: string;
  title: string;
  description: string;
}

function getContextNotices(
  context: LoginRouteOptions,
  activeTab: LoginMode
): ContextNotice[] {
  const completionLabel =
    activeTab === 'signup' ? 'Registrierung' : 'Anmeldung';
  const notices: ContextNotice[] = [];

  if (context.code) {
    notices.push({
      id: 'invite-code',
      title: 'Einladungscode bleibt erhalten',
      description: `Nach der ${completionLabel} geht es direkt zur Erfassung.`,
    });
  }

  if (context.importUseCase) {
    notices.push({
      id: 'import',
      title: 'Import bleibt erhalten',
      description: `Nach der ${completionLabel} wird das ausgewählte KI-System in Ihr Register übernommen.`,
    });
  }

  if (context.workspaceInvite) {
    notices.push({
      id: 'workspace-invite',
      title: 'Workspace-Einladung bleibt erhalten',
      description: `Nach der ${completionLabel} wird die Einladung automatisch übernommen.`,
    });
  }

  if (context.purchase || context.sessionId) {
    notices.push({
      id: 'purchase',
      title: 'Kaufkontext erkannt',
      description:
        'Verwenden Sie dieselbe E-Mail-Adresse wie beim Kauf.',
    });
  }

  return notices;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const loginContext = readLoginRouteOptions(searchParams);
  const {
    mode: modeFromQuery,
    email: emailFromQuery,
    code: inviteCodeFromQuery,
    workspaceInvite: workspaceInviteFromQuery,
    importUseCase: importUseCaseId,
    purchase: purchaseFromQuery,
    sessionId,
  } = loginContext;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LoginMode>(() =>
    getInitialLoginMode({
      mode: modeFromQuery,
      workspaceInvite: workspaceInviteFromQuery,
      importUseCase: importUseCaseId,
      purchase: purchaseFromQuery,
      sessionId,
    })
  );
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const showExistingUserOnly = modeFromQuery === 'login';
  const loginHref = useMemo(
    () =>
      buildLoginPath({
        ...loginContext,
        mode: 'login',
      }),
    [loginContext]
  );
  const signupHref = useMemo(
    () =>
      buildLoginPath({
        ...loginContext,
        mode: 'signup',
      }),
    [loginContext]
  );
  const setupHref = importUseCaseId
    ? `/einrichten?import=${encodeURIComponent(importUseCaseId)}`
    : '/einrichten';
  const inviteHref = inviteCodeFromQuery
    ? `/einladen?code=${encodeURIComponent(inviteCodeFromQuery)}`
    : '/einladen';
  const contextNotices = useMemo(
    () => getContextNotices(loginContext, activeTab),
    [activeTab, loginContext]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    async function loadAuth() {
      try {
        await import('@/lib/firebase');
      } catch (error) {
        console.error('Failed to load Firebase:', error);
      }
    }

    void loadAuth();
  }, []);

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery);
    }
  }, [emailFromQuery, form]);

  useEffect(() => {
    if (!sessionId || emailFromQuery) {
      return;
    }

    fetch(`/api/stripe-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.customer_email) {
          form.setValue('email', data.customer_email);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch email from Stripe session:', error);
      });
  }, [emailFromQuery, form, sessionId]);

  useEffect(() => {
    setActiveTab(
      getInitialLoginMode({
        mode: modeFromQuery,
        workspaceInvite: workspaceInviteFromQuery,
        importUseCase: importUseCaseId,
        purchase: purchaseFromQuery,
        sessionId,
      })
    );
    setShowForgotPassword(false);
  }, [
    importUseCaseId,
    modeFromQuery,
    purchaseFromQuery,
    sessionId,
    workspaceInviteFromQuery,
  ]);

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
      });
      return;
    }

    setIsResetting(true);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, resetEmail.toLowerCase());
      toast({
        title: 'E-Mail gesendet',
        description:
          'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch {
      toast({
        title: 'E-Mail gesendet',
        description:
          'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAuthAction = async (data: FormData, action: LoginMode) => {
    setIsLoading(true);
    const email = data.email.toLowerCase();

    try {
      const { getFirebaseAuth, getFirebaseDb } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const {
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
      } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');

      const acceptWorkspaceInvites = async (userId: string) => {
        if (!userId || !email) {
          return;
        }

        try {
          const response = await fetch('/api/invites/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              email,
              workspaceInvite: workspaceInviteFromQuery || undefined,
            }),
          });
          const payload = await response.json().catch(() => ({}));

          if (response.ok && payload?.success && Number(payload.applied) > 0) {
            toast({
              title: 'Workspace-Einladung übernommen',
              description: `Du wurdest ${
                payload.applied === 1
                  ? 'einem Workspace'
                  : `${payload.applied} Workspaces`
              } hinzugefügt.`,
            });
          }
        } catch (acceptError) {
          console.error('Failed to accept workspace invite:', acceptError);
        }
      };

      if (action === 'login') {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          data.password
        );
        await acceptWorkspaceInvites(credential.user.uid);

        if (importUseCaseId) {
          toast({
            title: 'Anmeldung erfolgreich',
            description: 'Import wird übernommen...',
          });
          router.push(`/einrichten?import=${encodeURIComponent(importUseCaseId)}`);
        } else if (inviteCodeFromQuery) {
          toast({
            title: 'Anmeldung erfolgreich',
            description: 'Leite weiter zur Erfassung...',
          });
          router.push(`/erfassen?code=${encodeURIComponent(inviteCodeFromQuery)}`);
        } else {
          toast({
            title: 'Anmeldung erfolgreich',
            description: 'Leite weiter zum Register...',
          });
          router.push('/my-register');
        }

        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        data.password
      );

      const db = await getFirebaseDb();
      const customerRef = doc(db, 'customers', email);
      const customerSnap = await getDoc(customerRef);

      let hasPurchased =
        customerSnap.exists() && customerSnap.data()?.status === 'active';

      if (!hasPurchased) {
        try {
          const response = await fetch(
            'https://europe-west1-ai-act-compass-m6o05.cloudfunctions.net/api/check-stripe-purchase',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            }
          );
          const result = await response.json();
          hasPurchased = result.hasPurchased === true;

          if (hasPurchased) {
            console.log(
              'Purchase verified via Stripe API fallback:',
              result.source
            );
          }
        } catch (stripeError) {
          console.error('Stripe API check failed:', stripeError);
        }
      }

      if (!hasPurchased) {
        await userCredential.user.delete().catch(async () => {
          await signOut(auth);
        });

        toast({
          variant: 'destructive',
          title: 'Registrierung nicht möglich',
          description:
            'Diese E-Mail-Adresse hat keinen gültigen Kauf. Bitte kaufen Sie zuerst das Produkt auf kiregister.com.',
        });
        return;
      }

      await acceptWorkspaceInvites(userCredential.user.uid);
      toast({
        title: 'Registrierung erfolgreich',
        description: 'Sie werden weitergeleitet.',
      });

      if (importUseCaseId) {
        router.push(`/einrichten?import=${encodeURIComponent(importUseCaseId)}`);
      } else if (inviteCodeFromQuery) {
        router.push(`/erfassen?code=${encodeURIComponent(inviteCodeFromQuery)}`);
      } else {
        router.push('/my-register');
      }
    } catch (error: any) {
      console.error(`${action} failed`, error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description:
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password'
            ? 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.'
            : error.code === 'auth/email-already-in-use'
              ? 'Diese E-Mail-Adresse wird bereits verwendet.'
              : error.code === 'auth/configuration-not-found'
                ? 'Firebase-Konfigurationsfehler. Bitte kontaktieren Sie den Support.'
                : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center justify-center gap-2">
        <ThemeAwareLogo
          alt="KI-Register"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="text-xl font-bold">KI-Register</span>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {contextNotices.length > 0 && (
          <div className="space-y-3">
            {contextNotices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-lg border bg-muted/30 px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {notice.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notice.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as LoginMode)}
          className="w-full"
        >
          {!showExistingUserOnly && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>
                  {showExistingUserOnly
                    ? 'Mit bestehendem Konto anmelden'
                    : 'Anmelden'}
                </CardTitle>
                <CardDescription>
                  Geben Sie Ihre Zugangsdaten ein, um auf Ihr Register
                  zuzugreifen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleAuthAction(data, 'login')
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ihre@email.de"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Melde an...' : 'Anmelden'}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4">
                  {!showForgotPassword ? (
                    <button
                      type="button"
                      className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(form.getValues('email'));
                      }}
                    >
                      Passwort vergessen?
                    </button>
                  ) : (
                    <div className="space-y-3 border-t pt-2">
                      <p className="text-sm text-muted-foreground">
                        Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link
                        zu erhalten.
                      </p>
                      <Input
                        type="email"
                        placeholder="ihre@email.de"
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={isResetting}
                          onClick={handlePasswordReset}
                        >
                          {isResetting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Reset-Link senden'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {showExistingUserOnly && (
                  <p className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">
                    Noch kein Konto?{' '}
                    <Link
                      href={signupHref}
                      className="underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Registrierung öffnen
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Neues Konto erstellen</CardTitle>
                <CardDescription>
                  Registrieren Sie sich nur, wenn noch kein Konto existiert.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      handleAuthAction(data, 'signup')
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ihre@email.de"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Erstelle Konto...' : 'Konto erstellen'}
                    </Button>
                  </form>
                </Form>

                <p className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">
                  Bereits ein Konto?{' '}
                  <Link
                    href={loginHref}
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Direkt anmelden
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={inviteHref}
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            Ich habe einen Einladungscode
          </Link>
          <Link
            href={setupHref}
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            Neues Register einrichten
          </Link>
        </div>
      </div>
    </div>
  );
}
