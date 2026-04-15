'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Link2, Settings, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { AccountSettingsSection } from '@/components/settings/account-settings-section';
import { AffiliateSettingsSection } from '@/components/settings/affiliate-settings-section';
import { GovernanceSettingsSection } from '@/components/settings/governance-settings-section';
import { SignedInAreaFrame } from '@/components/product-shells';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { localizeHref } from '@/lib/i18n/localize-href';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { useIsAffiliate } from '@/lib/affiliate/use-is-affiliate';

type SettingsSection = 'account' | 'governance' | 'affiliate';

function resolveSection(section: string | null | undefined): SettingsSection {
  if (section === 'governance') return 'governance';
  if (section === 'affiliate') return 'affiliate';
  return 'account';
}

export default function SettingsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();

  const activeSection = resolveSection(searchParams.get('section'));
  const { isAffiliate } = useIsAffiliate();
  const copy =
    locale === 'de'
      ? {
          loadingNextStep: 'Wir laden Ihre Einstellungen.',
          description:
            'Konto, Einladungen und registerweite Governance-Einstellungen auf einer einzigen Seite.',
          nextStepGovernance:
            'Pflegen Sie Rollen, Review-Logik und Zugangscodes im Governance-Bereich.',
          nextStepAccount: 'Verwalten Sie zuerst Konto, Sicherheit und Einladungen.',
          introTitle: 'Ein Einstellungsort statt zwei verschiedene Wege',
          introDescription:
            'Kontoeinstellungen und Governance-Regeln liegen jetzt auf derselben Oberfläche. Das Zahnrad im Header öffnet den Konto-Bereich, das Zahnrad im Register direkt den Governance-Bereich.',
          agentKit: 'Agent Kit API Keys',
          publicDocs: 'Öffentliche API-Doku',
        }
      : {
          loadingNextStep: 'We are loading your settings.',
          description:
            'Account, invitations and register-wide governance settings on a single page.',
          nextStepGovernance:
            'Maintain roles, review logic and access codes in the governance area.',
          nextStepAccount: 'Manage account, security and invitations first.',
          introTitle: 'One settings surface instead of two paths',
          introDescription:
            'Account settings and governance rules now live on the same surface. The gear in the header opens the account area, and the gear inside the register opens the governance area directly.',
          agentKit: 'Agent Kit API keys',
          publicDocs: 'Public API docs',
        };

  if (loading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title={t('settings.title')}
        description={t('settings.description')}
        nextStep={copy.loadingNextStep}
        width="5xl"
      >
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    router.push(localizeHref(locale, '/login'));
    return null;
  }

  const handleSectionChange = (section: string) => {
    const nextSection = resolveSection(section);
    if (nextSection === 'governance') {
      router.replace(localizeHref(locale, ROUTE_HREFS.governanceSettings), {
        scroll: false,
      });
    } else if (nextSection === 'affiliate') {
      router.replace(localizeHref(locale, '/settings?section=affiliate'), {
        scroll: false,
      });
    } else {
      router.replace(localizeHref(locale, ROUTE_HREFS.settings), {
        scroll: false,
      });
    }
  };

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title={t('settings.title')}
      description={copy.description}
      nextStep={
        activeSection === 'governance'
          ? copy.nextStepGovernance
          : copy.nextStepAccount
      }
      width="5xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-950">
            {copy.introTitle}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {copy.introDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={localizeHref(locale, '/settings/agent-kit')}
              className="inline-flex items-center rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.agentKit}
            </Link>
            <Link
              href={localizeHref(locale, '/developers/agent-kit')}
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copy.publicDocs}
            </Link>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={handleSectionChange}>
          <TabsList className={`grid h-auto w-full max-w-xl gap-2 rounded-lg bg-slate-100 p-1 ${isAffiliate ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
            >
              <Settings className="h-4 w-4" />
              {t('settings.accountTab')}
            </TabsTrigger>
            <TabsTrigger
              value="governance"
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
            >
              <Shield className="h-4 w-4" />
              {t('settings.governanceTab')}
            </TabsTrigger>
            {isAffiliate && (
              <TabsTrigger
                value="affiliate"
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
              >
                <Link2 className="h-4 w-4" />
                {t('nav.affiliate')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="mt-6">
            <AccountSettingsSection />
          </TabsContent>

          <TabsContent value="governance" className="mt-6">
            <GovernanceSettingsSection />
          </TabsContent>

          {isAffiliate && (
            <TabsContent value="affiliate" className="mt-6">
              <AffiliateSettingsSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </SignedInAreaFrame>
  );
}
