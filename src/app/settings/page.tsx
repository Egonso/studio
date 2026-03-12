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
import { SignedInAreaFrame } from '@/components/product-shells';
import { Loader2, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { verifyOfficerKey } from '@/actions/officer-actions';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useEffect } from 'react';
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

const officerSchema = z.object({
  licenseKey: z.string().min(1, { message: 'Bitte geben Sie Ihren Zertifikats-Code ein.' }),
});
type OfficerFormData = z.infer<typeof officerSchema>;

const inviteSchema = z.object({
  email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
  role: z.enum(['EXTERNAL_OFFICER', 'MEMBER', 'ADMIN'], { required_error: 'Bitte wählen Sie eine Rolle.' }),
});
type InviteFormData = z.infer<typeof inviteSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOfficerLoading, setIsOfficerLoading] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const { profile } = useUserProfile();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', currentPasswordForEmail: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const officerForm = useForm<OfficerFormData>({
    resolver: zodResolver(officerSchema),
    defaultValues: { licenseKey: '' },
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'EXTERNAL_OFFICER' },
  });

  useEffect(() => {
    if (profile?.licenseKey) {
      officerForm.setValue('licenseKey', profile.licenseKey);
    }
  }, [profile, officerForm]);

  const handleOfficerSubmit = async (data: OfficerFormData) => {
    setIsOfficerLoading(true);
    try {
      const res = await verifyOfficerKey(user!.uid, data.licenseKey);
      if (res.success) {
        toast({ title: 'Erfolgreich', description: 'Sie sind nun als EUKI Certified Officer verifiziert.' });
      } else {
        toast({ variant: 'destructive', title: 'Fehler', description: res.message });
      }
    } catch (_err: any) {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Verifizierung fehlgeschlagen.' });
    } finally {
      setIsOfficerLoading(false);
    }
  };

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
    <SignedInAreaFrame
      area="signed_in_free_register"
      title="Settings"
      description="Verwalten Sie Anmeldedaten, Registerzugang und persönliche Freischaltungen."
      nextStep="Prüfen Sie zuerst Konto, Einladungen und Governance-Einstellungen."
      width="5xl"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Kontoeinstellungen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verwalten Sie Ihre Anmeldedaten und Kontosicherheit.</p>
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

        {/* Zertifizierung */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Zertifikats-Code</CardTitle>
            </div>
            <CardDescription>Hinterlegen Sie Ihren Code, um Register-Einträge rechtssicher freigeben zu können.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.isOfficer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verifiziert als EU AI Act Officer</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Zertifiziert durch: {profile.certifiedBy} <br />
                  Geprüft am: {new Date(profile.verifiedAt!).toLocaleDateString('de-DE')}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="pt-4 mt-2 border-t text-sm text-muted-foreground">
                  <p>
                    Noch kein Officer? Zertifizieren Sie sich in der{' '}
                    <a
                      href="https://kiregister.com/certification"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      EUKIgesetz Academy
                    </a>
                  </p>
                </div>
                <Form {...officerForm}>
                  <form onSubmit={officerForm.handleSubmit(handleOfficerSubmit)} className="space-y-4">
                    <FormField
                      control={officerForm.control}
                      name="licenseKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zertifikats-Code</FormLabel>
                          <FormControl>
                            <Input placeholder="EUK-XXXX-XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isOfficerLoading}>
                      {isOfficerLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird geprüft...</> : 'Zertifikat hinterlegen'}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Einladen */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Team & Externe Berater einladen</CardTitle>
            </div>
            <CardDescription>Laden Sie Nutzer in Ihren Register-Workspace ein (etwa einen External Officer für Freigaben).</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(async (data) => {
                setIsInviteLoading(true);
                try {
                  const token = await user?.getIdToken();
                  if (!token) {
                    throw new Error('Nicht autorisiert');
                  }

                  const res = await fetch('/api/invites', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      email: data.email,
                      role: data.role,
                      targetOrgId: user.uid,
                      targetOrgName: 'Ihr Register', // Could be dynamic if register names are introduced
                    })
                  });
                  const json = await res.json();
                  if (res.ok) {
                    if (json?.inviteLink) {
                      let copied = false;
                      try {
                        await navigator.clipboard.writeText(json.inviteLink);
                        copied = true;
                      } catch {
                        copied = false;
                      }

                      toast({
                        title: 'Einladung erstellt',
                        description: copied
                          ? 'Einladungslink wurde in die Zwischenablage kopiert.'
                          : 'Einladungslink erstellt. Bitte Browser-Zugriff auf die Zwischenablage erlauben und erneut senden.',
                      });
                    } else {
                      toast({ title: 'Erfolgreich', description: json.message });
                    }
                    inviteForm.reset();
                  } else {
                    toast({ variant: 'destructive', title: 'Fehler', description: json.error });
                  }
                } catch (_err) {
                  toast({ variant: 'destructive', title: 'Fehler', description: 'Konnte keine Einladung senden.' });
                } finally {
                  setIsInviteLoading(false);
                }
              })} className="space-y-4">
                <FormField
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail-Adresse des Nutzers</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="berater@kanzlei.de" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle im Workspace</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="EXTERNAL_OFFICER">External Officer (Auditor)</option>
                          <option value="MEMBER">Mitarbeiter (Lesen/Schreiben)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isInviteLoading}>
                  {isInviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gesendet...</> : 'Nutzer einladen'}
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
      </div>
    </SignedInAreaFrame>
  );
}
