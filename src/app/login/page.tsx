
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
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery);
      setActiveTab('signup');
    }
  }, [searchParams, form]);


  const handleAuthAction = async (data: FormData, action: 'login' | 'signup') => {
    setIsLoading(true);
    const email = data.email.toLowerCase();

    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');

      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, data.password);
        toast({ title: 'Anmeldung erfolgreich', description: 'Leite weiter zu Ihren Projekten...' });
        router.push('/projects');
      } else { // signup
        await createUserWithEmailAndPassword(auth, email, data.password);
        toast({ title: 'Registrierung erfolgreich', description: 'Sie werden weitergeleitet, um Ihr erstes Projekt zu erstellen.' });
        router.push('/projects');
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
          src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp"
          alt="AI Act Compass Logo"
          width={50}
          height={50}
          className="h-12 w-auto"
        />
        <span className="font-bold text-2xl">AI Act Compass</span>
      </div>
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

