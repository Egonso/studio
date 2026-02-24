
'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2, Wand2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { PolicyDocument, PolicyOrgSnapshot, PolicyContext } from '@/lib/policy-engine/types';
import { policyService } from '@/lib/policy-engine/policy-service';
import { registerService } from '@/lib/register-first/register-service';
import { PolicyListView } from '@/components/policy-engine/policy-list';
import { PolicyBuilderWizard } from '@/components/policy-engine/policy-builder-wizard';
import { PolicyPreview } from '@/components/policy-engine/policy-preview';

type PageView = 'list' | 'wizard' | 'preview';

function ComplianceInADayPageContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [view, setView] = useState<PageView>('list');
    const [policies, setPolicies] = useState<PolicyDocument[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [orgSnapshot, setOrgSnapshot] = useState<PolicyOrgSnapshot>({
        organisationName: '',
    });
    const [registerId, setRegisterId] = useState<string | null>(null);

    // Load policies and org data
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        async function load() {
            try {
                const registers = await registerService.listRegisters();
                if (cancelled) return;

                if (registers.length > 0) {
                    const reg = registers[0];
                    setRegisterId(reg.registerId);
                    setOrgSnapshot({
                        organisationName: reg.organisationName || '',
                        industry: reg.orgSettings?.industry,
                        contactPerson: reg.orgSettings?.contactPerson?.name,
                    });

                    const polList = await policyService.listPolicies(reg.registerId);
                    if (!cancelled) setPolicies(polList);
                }
            } catch (err) {
                console.error('Failed to load policy data', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void load();
        return () => { cancelled = true; };
    }, [user]);

    const handleSelectPolicy = useCallback(async (policyId: string) => {
        if (!registerId) return;
        const doc = await policyService.getPolicy(registerId, policyId);
        if (doc) {
            setSelectedPolicy(doc);
            setView('preview');
        }
    }, [registerId]);

    const handleSave = useCallback(async (
        partial: Omit<PolicyDocument, 'policyId' | 'metadata'>,
    ) => {
        if (!registerId || !user) return;
        const created = await policyService.createPolicy(
            registerId,
            partial.level,
            partial.orgContextSnapshot,
            user.uid,
        );
        // Update sections if assembler provided them
        if (partial.sections.length > 0) {
            await policyService.updatePolicy(registerId, created.policyId, {
                sections: partial.sections,
            });
        }
        toast({
            title: 'Richtlinie erstellt!',
            description: `Level ${partial.level} – ${partial.title}`,
        });
        // Refresh list
        const polList = await policyService.listPolicies(registerId);
        setPolicies(polList);
        setView('list');
    }, [registerId, user, toast]);

    if (authLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Page Header */}
                    <Card className="w-full shadow-sm bg-secondary/50 border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                        <Wand2 className="h-5 w-5" />
                                        Smart Policy Engine
                                    </CardTitle>
                                    <CardDescription className="mt-1 max-w-2xl">
                                        Erstellen Sie in wenigen Schritten eine KI-Richtlinie für Ihr Unternehmen.
                                        {view === 'preview' && selectedPolicy && (
                                            <Button
                                                variant="link"
                                                className="ml-2 p-0 h-auto"
                                                onClick={() => { setView('list'); setSelectedPolicy(null); }}
                                            >
                                                ← Zurück zur Übersicht
                                            </Button>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : view === 'list' ? (
                        <PolicyListView
                            policies={policies}
                            onSelect={(id) => void handleSelectPolicy(id)}
                            onCreate={() => setView('wizard')}
                        />
                    ) : view === 'wizard' ? (
                        <PolicyBuilderWizard
                            context={null}
                            assembledSections={[]}
                            orgSnapshot={orgSnapshot}
                            canAccessLevel3={false}
                            onSave={handleSave}
                            onCancel={() => setView('list')}
                        />
                    ) : view === 'preview' && selectedPolicy ? (
                        <div className="space-y-4">
                            <PolicyPreview
                                sections={selectedPolicy.sections}
                                showPrintButton
                            />
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}

export default function ComplianceInADayPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        }>
            <ComplianceInADayPageContent />
        </Suspense>
    );
}
