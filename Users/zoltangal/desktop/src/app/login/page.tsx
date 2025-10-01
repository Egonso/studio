'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
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
  
  const emailFromUrl = searchParams.get('email');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: emailFromUrl || '', password: '' },
  });

  useEffect(() => {
    if (emailFromUrl) {
      form.setValue('email', emailFromUrl);
    }
  }, [emailFromUrl, form]);

  const handleAuthAction = async (data: FormData, action: 'login' | 'signup') => {
    setIsLoading(true);
    const email = data.email.toLowerCase();

    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, data.password);
        toast({ title: 'Anmeldung erfolgreich', description: 'Leite weiter zu Ihren Projekten...' });
        router.push('/projects');
      } else { // signup
        // Registrierungsprüfung wurde entfernt - jeder kann sich registrieren
        await createUserWithEmailAndPassword(auth, email, data.password);
        toast({ title: 'Registrierung erfolgreich', description: 'Sie werden weitergeleitet, um Ihr erstes Projekt zu erstellen.' });
        router.push('/projects');
      }
    } catch (error: any) {
      console.error(`${action} failed`, error);

      let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
      switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
              errorMessage = 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
              break;
          case 'auth/email-already-in-use':
              errorMessage = 'Diese E-Mail-Adresse wird bereits für ein Konto verwendet.';
              break;
          case 'auth/weak-password':
              errorMessage = 'Das Passwort ist zu schwach. Es muss mindestens 6 Zeichen lang sein.';
              break;
          case 'auth/invalid-email':
              errorMessage = 'Die E-Mail-Adresse ist ungültig. Bitte überprüfen Sie sie.';
              break;
          case 'auth/operation-not-allowed':
              errorMessage = 'Registrierungen mit E-Mail/Passwort sind derzeit nicht aktiviert.';
              break;
          case 'auth/network-request-failed':
              errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
              break;
          default:
              errorMessage = `Ein Fehler ist aufgetreten. Code: ${error.code}`;
              break;
      }

      toast({
        variant: 'destructive',
        title: `${action === 'login' ? 'Anmeldung' : 'Registrierung'} fehlgeschlagen`,
        description: errorMessage,
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
      <Tabs defaultValue="signup" className="w-full max-w-sm">
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
                Füllen Sie die Felder aus, um ein neues Konto zu erstellen.
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
