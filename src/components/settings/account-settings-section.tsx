'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { verifyOfficerKey } from '@/actions/officer-actions';
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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { buildPublicAppUrl } from '@/lib/app-url';
import { APP_LOCALE } from '@/lib/locale';

const emailSchema = z.object({
  newEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  currentPasswordForEmail: z.string().min(1, {
    message: 'Please enter your current password.',
  }),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: 'Please enter your current password.',
    }),
    newPassword: z.string().min(6, {
      message: 'Password must be at least 6 characters long.',
    }),
    confirmPassword: z.string().min(1, {
      message: 'Please confirm your new password.',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const officerSchema = z.object({
  licenseKey: z.string().min(1, {
    message: 'Please enter your certificate code.',
  }),
});

const inviteSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  role: z.enum(['EXTERNAL_OFFICER', 'MEMBER', 'ADMIN'], {
    required_error: 'Please select a role.',
  }),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type OfficerFormData = z.infer<typeof officerSchema>;
type InviteFormData = z.infer<typeof inviteSchema>;

export function AccountSettingsSection() {
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isOfficerLoading, setIsOfficerLoading] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', currentPasswordForEmail: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
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
  }, [officerForm, profile]);

  if (!user) {
    return null;
  }

  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(APP_LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '–';

  const handleOfficerSubmit = async (data: OfficerFormData) => {
    setIsOfficerLoading(true);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('NOT_AUTHENTICATED');
      }

      const res = await verifyOfficerKey(idToken, data.licenseKey);
      if (res.success) {
        toast({
          title: 'Success',
          description: t('settings.account.officerSuccess'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: res.message,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('settings.account.verificationFailed'),
      });
    } finally {
      setIsOfficerLoading(false);
    }
  };

  const handleEmailChange = async (data: EmailFormData) => {
    setIsEmailLoading(true);
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const {
        reauthenticateWithCredential,
        EmailAuthProvider,
        verifyBeforeUpdateEmail,
      } =
        await import('firebase/auth');

      const credential = EmailAuthProvider.credential(
        user.email!,
        data.currentPasswordForEmail,
      );
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await verifyBeforeUpdateEmail(auth.currentUser!, data.newEmail, {
        url: buildPublicAppUrl('/settings?section=account'),
      });

      toast({
        title: t('settings.account.confirmationSent'),
        description: t('settings.account.confirmationSentDesc'),
      });
      emailForm.reset();
    } catch (error: any) {
      const isWrongPassword =
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential';
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: isWrongPassword
          ? t('settings.account.incorrectPassword')
          : error.code === 'auth/email-already-in-use'
            ? t('settings.account.emailAlreadyInUse')
            : t('settings.account.emailVerificationFailed'),
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
      const {
        reauthenticateWithCredential,
        EmailAuthProvider,
        updatePassword,
      } = await import('firebase/auth');

      const credential = EmailAuthProvider.credential(
        user.email!,
        data.currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, data.newPassword);

      toast({
        title: t('settings.account.passwordUpdated'),
        description: t('settings.account.passwordUpdatedDesc'),
      });
      passwordForm.reset();
    } catch (error: any) {
      const isWrongPassword =
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential';
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: isWrongPassword
          ? t('settings.account.incorrectCurrentPassword')
          : t('settings.account.passwordChangeFailed'),
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('settings.account.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.account.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t('settings.account.accountInfo')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('settings.account.emailAddress')}</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('settings.account.memberSince')}</span>
            <span className="font-medium">{createdAt}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t('settings.account.changeEmail')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.account.changeEmailDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(handleEmailChange)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.account.newEmail')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="new@email.com"
                        {...field}
                      />
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
                    <FormLabel>{t('settings.account.currentPasswordForEmail')}</FormLabel>
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
              <Button type="submit" disabled={isEmailLoading}>
                {isEmailLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.account.updating')}
                  </>
                ) : (
                  t('settings.account.updateEmail')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{t('settings.account.certificateCode')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.account.certificateCodeDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.isOfficer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <ShieldCheck className="h-4 w-4" />
                <span>{t('settings.account.verifiedOfficer')}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('settings.account.certifiedBy', { certifier: profile.certifiedBy ?? '' })}
                <br />
                {t('settings.account.verifiedAt', { date: new Date(profile.verifiedAt!).toLocaleDateString(APP_LOCALE) })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mt-2 border-t pt-4 text-sm text-muted-foreground">
                <p>
                  Noch kein Officer? Zertifizieren Sie sich in der{' '}
                  <a
                    href="https://kiregister.com/certification"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    EUKIgesetz Academy
                  </a>
                </p>
              </div>
              <Form {...officerForm}>
                <form
                  onSubmit={officerForm.handleSubmit(handleOfficerSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={officerForm.control}
                    name="licenseKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.account.certificateCode')}</FormLabel>
                        <FormControl>
                          <Input placeholder="EUK-XXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isOfficerLoading}>
                    {isOfficerLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('settings.account.verifying')}
                      </>
                    ) : (
                      t('settings.account.submitCertificate')
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('settings.account.teamInvite')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('settings.account.teamInviteDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(async (data) => {
                setIsInviteLoading(true);
                try {
                  const token = await user.getIdToken();
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
                      targetOrgName: 'Ihr Register',
                    }),
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
                        title: t('settings.account.inviteCreated'),
                        description: copied
                          ? t('settings.account.inviteLinkCopied')
                          : t('settings.account.inviteLinkCreated'),
                      });
                    } else {
                      toast({
                        title: 'Erfolgreich',
                        description: json.message,
                      });
                    }
                    inviteForm.reset();
                  } else {
                    toast({
                      variant: 'destructive',
                      title: t('common.error'),
                      description: json.error,
                    });
                  }
                } catch {
                  toast({
                    variant: 'destructive',
                    title: t('common.error'),
                    description: t('settings.account.inviteFailed'),
                  });
                } finally {
                  setIsInviteLoading(false);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.account.inviteUserEmail')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="berater@kanzlei.de"
                        {...field}
                      />
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
                    <FormLabel>{t('settings.account.workspaceRole')}</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="EXTERNAL_OFFICER">
                          {t('settings.account.externalOfficer')}
                        </option>
                        <option value="MEMBER">
                          {t('settings.account.memberRole')}
                        </option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isInviteLoading}>
                {isInviteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.account.sending')}
                  </>
                ) : (
                  t('settings.account.sendInvite')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Passwort ändern</CardTitle>
          </div>
          <CardDescription>
            {t('settings.account.changePasswordDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.account.currentPassword')}</FormLabel>
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
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.account.newPassword')}</FormLabel>
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
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.account.confirmNewPassword')}</FormLabel>
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
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.account.updating')}
                  </>
                ) : (
                  t('settings.account.updatePassword')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
