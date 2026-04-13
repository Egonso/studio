'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Link2, Settings, Shield } from 'lucide-react';

import { AccountSettingsSection } from '@/components/settings/account-settings-section';
import { AffiliateSettingsSection } from '@/components/settings/affiliate-settings-section';
import { GovernanceSettingsSection } from '@/components/settings/governance-settings-section';
import { SignedInAreaFrame } from '@/components/product-shells';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';
import { getAffiliateProfile } from '@/app/actions/affiliate';

type SettingsSection = 'account' | 'governance' | 'affiliate';

function resolveSection(section: string | null | undefined): SettingsSection {
  if (section === 'governance') return 'governance';
  if (section === 'affiliate') return 'affiliate';
  return 'account';
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = resolveSection(searchParams.get('section'));
  const [isAffiliate, setIsAffiliate] = useState(false);

  const checkAffiliateStatus = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const profile = await getAffiliateProfile(idToken);
      setIsAffiliate(profile.isAffiliate);
    } catch {
      setIsAffiliate(false);
    }
  }, [user]);

  useEffect(() => {
    void checkAffiliateStatus();
  }, [checkAffiliateStatus]);

  if (loading) {
    return (
      <SignedInAreaFrame
        area="signed_in_free_register"
        title="Settings"
        description="Konto und Governance an einem Ort."
        nextStep="Wir laden Ihre Einstellungen."
        width="5xl"
      >
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SignedInAreaFrame>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSectionChange = (section: string) => {
    const nextSection = resolveSection(section);
    if (nextSection === 'governance') {
      router.replace(ROUTE_HREFS.governanceSettings, { scroll: false });
    } else if (nextSection === 'affiliate') {
      router.replace('/settings?section=affiliate', { scroll: false });
    } else {
      router.replace(ROUTE_HREFS.settings, { scroll: false });
    }
  };

  return (
    <SignedInAreaFrame
      area="signed_in_free_register"
      title="Settings"
      description="Konto, Einladungen und registerweite Governance-Einstellungen auf einer einzigen Seite."
      nextStep={
        activeSection === 'governance'
          ? 'Pflegen Sie Rollen, Review-Logik und Zugangscodes im Governance-Bereich.'
          : 'Verwalten Sie zuerst Konto, Sicherheit und Einladungen.'
      }
      width="5xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-950">
            Ein Einstellungsort statt zwei verschiedene Wege
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Konto-Einstellungen und Governance-Regeln liegen jetzt auf derselben
            Oberfläche. Das Zahnrad im Header öffnet den Konto-Bereich, das
            Zahnrad im Register direkt den Governance-Bereich.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/settings/agent-kit"
              className="inline-flex items-center rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Agent Kit API Keys
            </Link>
            <Link
              href="/developers/agent-kit"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Öffentliche API-Doku
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
              Konto
            </TabsTrigger>
            <TabsTrigger
              value="governance"
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
            >
              <Shield className="h-4 w-4" />
              Governance
            </TabsTrigger>
            {isAffiliate && (
              <TabsTrigger
                value="affiliate"
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
              >
                <Link2 className="h-4 w-4" />
                Affiliate
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
