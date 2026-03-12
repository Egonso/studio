'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Settings, Shield } from 'lucide-react';

import { AccountSettingsSection } from '@/components/settings/account-settings-section';
import { GovernanceSettingsSection } from '@/components/settings/governance-settings-section';
import { SignedInAreaFrame } from '@/components/product-shells';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { ROUTE_HREFS } from '@/lib/navigation/route-manifest';

type SettingsSection = 'account' | 'governance';

function resolveSection(section: string | null | undefined): SettingsSection {
  return section === 'governance' ? 'governance' : 'account';
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = resolveSection(searchParams.get('section'));

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
    router.replace(
      nextSection === 'governance'
        ? ROUTE_HREFS.governanceSettings
        : ROUTE_HREFS.settings,
      { scroll: false },
    );
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
        </div>

        <Tabs value={activeSection} onValueChange={handleSectionChange}>
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
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
          </TabsList>

          <TabsContent value="account" className="mt-6">
            <AccountSettingsSection />
          </TabsContent>

          <TabsContent value="governance" className="mt-6">
            <GovernanceSettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </SignedInAreaFrame>
  );
}
