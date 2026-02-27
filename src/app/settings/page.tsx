'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/app-header';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const emailSchema = z.object({
  newEmail: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
  currentPasswordForEmail: z.string().min(1, { message: 'Bitte geben Sie Ihr aktuelles Passwort ein.' }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Bitte geben Sie Ihr aktuelles Passwort ein.' }),
  newPassword: z.string().min(6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }),
  confirmPassword: z.string().min(1, { message: 'Bitte bestätigen Sie Ihr neues Passwort.' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Die Passwörter stimmen nicht überein.',
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', currentPasswordForEmail: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleEmailChange = async (data: EmailFormData) => {
    setIsEmailLoading(true);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const { reauthenticateWithCredential, EmailAuthProvider, updateEmail } = await import('firebase/auth');

      const credential = EmailAuthProvider.credential(user.email!, data.currentPasswordForEmail);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updateEmail(auth.currentUser!, data.newEmail);

      toast({ title: 'E-Mail aktualisiert', description: `Ihre E-Mail-Adresse wurde auf ${data.newEmail} geändert.` });
      emailForm.reset();
    } catch (error: any) {
      const isWrongPassword = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential';
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: isWrongPassword
          ? 'Falsches Passwort. Bitte versuchen Sie es erneut.'
          : error.code === 'auth/email-already-in-use'
            ? 'Diese E-Mail-Adresse wird bereits verwendet.'
            : 'E-Mail konnte nicht geändert werden. Bitte versuchen Sie es erneut.',
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsPasswordLoading(true);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const { reauthenticateWithCredential, EmailAuthProvider, updatePassword } = await import('firebase/auth');

      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, data.newPassword);

      toast({ title: 'Passwort aktualisiert', description: 'Ihr Passwort wurde erfolgreich geändert.' });
      passwordForm.reset();
    } catch (error: any) {
      const isWrongPassword = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential';
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: isWrongPassword
          ? 'Falsches aktuelles Passwort. Bitte versuchen Sie es erneut.'
          : 'Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.',
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '–';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kontoeinstellungen</h1>
          <p className="text-muted-foreground text-sm mt-1">Verwalten Sie Ihre Anmeldedaten und Kontosicherheit.</p>
        </div>

        {/* Kontoinformationen */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Kontoinformationen</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">E-Mail-Adresse</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mitglied seit</span>
              <span className="font-medium">{createdAt}</span>
            </div>
          </CardContent>
        </Card>

        {/* E-Mail ändern */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">E-Mail-Adresse ändern</CardTitle>
            </div>
            <CardDescription>Geben Sie Ihr aktuelles Passwort ein, um Ihre E-Mail-Adresse zu ändern.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neue E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="neue@email.de" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="currentPasswordForEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktuelles Passwort</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isEmailLoading}>
                  {isEmailLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird aktualisiert...</> : 'E-Mail aktualisieren'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Passwort ändern */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Passwort ändern</CardTitle>
            </div>
            <CardDescription>Wählen Sie ein sicheres Passwort mit mindestens 6 Zeichen.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktuelles Passwort</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neues Passwort</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neues Passwort bestätigen</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird aktualisiert...</> : 'Passwort aktualisieren'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
