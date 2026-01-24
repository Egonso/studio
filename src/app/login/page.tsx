
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

const formSchema = z.object({
  email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
  password: z.string().min(6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [authReady, setAuthReady] = useState(false);
  const [isFromPurchase, setIsFromPurchase] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // Preload Firebase Auth
    async function loadAuth() {
      try {
        await import('@/lib/firebase');
        setAuthReady(true);
      } catch (error) {
        console.error('Failed to load Firebase:', error);
      }
    }
    loadAuth();

    const emailFromQuery = searchParams.get('email');
    const isPurchaseFlow = searchParams.get('purchase') === 'true';
    const sessionId = searchParams.get('session_id');

    // If we have a Stripe session_id, fetch the email from it
    if (sessionId && !emailFromQuery) {
      fetch(`/api/stripe-session?session_id=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.customer_email) {
            form.setValue('email', data.customer_email);
          }
        })
        .catch(err => {
          console.error('Failed to fetch email from Stripe session:', err);
        });
    }

    if (emailFromQuery) {
      form.setValue('email', emailFromQuery);
    }

    if (isPurchaseFlow || sessionId) {
      setActiveTab('signup');
      setIsFromPurchase(true);
    } else if (emailFromQuery) {
      // Optional: if just email is present (e.g. invite), maybe still default to signup? 
      // For now, let's keep it consistent: email usually implies intent to sign in or sign up.
      // But let's only force signup if purchase flow or explicitly requested.
      setActiveTab('signup');
    }
  }, [searchParams, form]);



  const handleAuthAction = async (data: FormData, action: 'login' | 'signup') => {
    setIsLoading(true);
    const email = data.email.toLowerCase();

    try {
      const { getFirebaseAuth, getFirebaseDb } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, signOut } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');

      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, data.password);
        toast({ title: 'Anmeldung erfolgreich', description: 'Leite weiter zum Dashboard...' });
        router.push('/dashboard');
      } else { // signup
        // 1. Create User (Log in immediately)
        const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);

        // 2. Check Purchase Status - Try Firestore first, then Stripe API fallback
        const db = await getFirebaseDb();
        const customerRef = doc(db, 'customers', email);
        const customerSnap = await getDoc(customerRef);

        let hasPurchased = customerSnap.exists() && customerSnap.data()?.status === 'active';

        // Fallback: Check Stripe API directly if Firestore check fails
        if (!hasPurchased) {
          try {
            const response = await fetch('https://api-smnzycso6q-uc.a.run.app/check-stripe-purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            const result = await response.json();
            hasPurchased = result.hasPurchased === true;
            if (hasPurchased) {
              console.log('Purchase verified via Stripe API fallback:', result.source);
            }
          } catch (stripeError) {
            console.error('Stripe API check failed:', stripeError);
          }
        }

        if (!hasPurchased) {
          // 3. Failed Check -> Cleanup
          await userCredential.user.delete().catch(async () => {
            // Fallback if delete fails (e.g. requires re-auth) -> just sign out
            await signOut(auth);
          });

          toast({
            variant: 'destructive',
            title: 'Registrierung nicht möglich',
            description: 'Diese E-Mail-Adresse hat keinen gültigen Kauf. Bitte kaufen Sie zuerst das Produkt auf eukigesetz.com.',
          });
        } else {
          // 4. Success
          toast({ title: 'Registrierung erfolgreich', description: 'Sie werden weitergeleitet, um Ihr erstes Projekt zu erstellen.' });
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error(`${action} failed`, error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
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
      <div className="flex items-center justify-center gap-2 mb-8">
        <Image
          src="/logo.png"
          alt="AI Act Compass Logo"
          width={50}
          height={50}
          className="h-12 w-auto"
        />
        <span className="font-bold text-2xl">AI Act Compass</span>
      </div>

      {/* Welcome Banner for Post-Purchase Users */}
      {isFromPurchase && (
        <div className="w-full max-w-sm mb-6 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 shadow-sm">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-slate-800">Willkommen bei AI Compliance OS!</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              <strong className="text-blue-700">Wir machen verantwortungsvolle KI skalierbar.</strong><br />
              Verwandeln Sie Bürokratie in einen audit-sicheren Wettbewerbsvorteil.
            </p>
            <div className="pt-2 border-t border-slate-200 mt-3">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Eine Bestätigungs-E-Mail wurde gesendet. Bitte verwenden Sie die gleiche E-Mail-Adresse wie beim Kauf.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Anmelden</TabsTrigger>
          <TabsTrigger value="signup">Registrieren</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Anmelden</CardTitle>
              <CardDescription>Geben Sie Ihre Daten ein, um auf Ihre Projekte zuzugreifen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => handleAuthAction(data, 'login'))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ihre@email.de" {...field} />
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
                          <Input type="password" placeholder="********" {...field} />
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Neues Konto erstellen</CardTitle>
              <CardDescription>
                Jeder kann sich mit einer gültigen E-Mail-Adresse registrieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => handleAuthAction(data, 'signup'))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ihre@email.de" {...field} />
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
                          <Input type="password" placeholder="********" {...field} />
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

