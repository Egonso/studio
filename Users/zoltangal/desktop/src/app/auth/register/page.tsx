
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
  password: z.string().min(6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const checkEligibility = async (email: string): Promise<{ eligible: boolean; reason?: string }> => {
    try {
      const functions = getFunctions();
      const checkFunction = httpsCallable(functions, 'checkSpecialRegistrationEligibility');
      const result = await checkFunction({ email });
      return result.data as { eligible: boolean; reason?: string };
    } catch (error) {
      console.error("Error calling eligibility function:", error);
      return { eligible: false, reason: 'Bei der Prüfung Ihrer Berechtigung ist ein Fehler aufgetreten.' };
    }
  };

  const handleRegister = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { eligible, reason } = await checkEligibility(data.email);

      if (!eligible) {
        toast({
          variant: 'destructive',
          title: 'Registrierung nicht möglich',
          description: reason || 'Sie sind nicht berechtigt, sich mit dieser E-Mail-Adresse zu registrieren. Bitte prüfen Sie Ihre Eingabe oder kontaktieren Sie den Support.',
        });
        return;
      }

      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Registrierung erfolgreich',
        description: 'Sie werden nun zur Projekt-Auswahl weitergeleitet.',
      });
      router.push('/projects');
    } catch (error: any) {
      console.error('Registration failed', error);

      let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Diese E-Mail-Adresse wird bereits für ein Konto verwendet.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Das Passwort ist zu schwach. Es muss mindestens 6 Zeichen lang sein.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Die E-Mail-Adresse ist ungültig.';
          break;
        default:
          errorMessage = `Ein Fehler ist aufgetreten. Code: ${error.code}`;
          break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Spezial-Registrierung</CardTitle>
          <CardDescription>Erstellen Sie hier ein neues Konto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
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
                      <Input type="password" placeholder="Mindestens 6 Zeichen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prüfe & erstelle Konto...
                  </>
                ) : (
                  'Konto erstellen'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
       <p className="mt-4 text-center text-sm text-muted-foreground">
        Haben Sie bereits ein Konto?{' '}
        <Link href="/login" className="underline">
          Zum Login
        </Link>
      </p>
    </div>
  );
}
