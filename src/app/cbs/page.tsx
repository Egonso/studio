
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2, Wand2, Share2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PolicyEditor, type PolicyData, type Level } from '@/components/policy-editor';
import { Button } from '@/components/ui/button';
import { createSharedPolicy, savePolicyData, getActiveProjectId, getFullProject, getAimsData } from '@/lib/data-service';
import { createOrLinkAiSystem } from '@/lib/ai-system-service';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ComplianceInADayPageContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [isSharing, setIsSharing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [policyData, setPolicyData] = useState<{ data: PolicyData, level: Level } | null>(null);
    const [existingPolicyLevel, setExistingPolicyLevel] = useState<string | null>(null);
    const [existingPolicyLastUpdated, setExistingPolicyLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        async function checkExisting() {
            const data = await getAimsData() as any;
            if (data?.policyLevel) {
                setExistingPolicyLevel(data.policyLevel);
                setExistingPolicyLastUpdated(data.policyUpdatedAt);
            }
        }
        checkExisting();
    }, []);

    const handleShare = async () => {
        if (!policyData) return;
        setIsSharing(true);
        const { policyId } = await createSharedPolicy({
            title: policyData.data.title,
            content: policyData.data.content,
            placeholders: policyData.data.placeholders,
        });
        setIsSharing(false);

        if (policyId) {
            const url = `${window.location.origin}/cbs/share/${policyId}`;
            setShareUrl(url);
        } else {
            toast({
                variant: 'destructive',
                title: 'Fehler beim Teilen',
                description: 'Die Richtlinie konnte nicht geteilt werden. Bitte versuchen Sie es erneut.'
            });
        }
    };

    const handleSave = async () => {
        if (!policyData) return;
        setIsSaving(true);
        try {
            // Updated Architecture Migration:
            // 1. Ensure an AI System exists for this context
            const projectId = getActiveProjectId();
            const project = await getFullProject();
            const orgId = project?.orgId || 'default-org'; // robust fallback 

            if (projectId) {
                // Create/Link a system representing this policy context
                // For CBS, we treat the main policy as the "General AI Governance" system or similar, 
                // but strictly speaking, CBS makes a *Policy*. 
                // To fit the "AI System" architecture, we attach it to a system named after the project if generic.
                const systemTitle = (project as any)?.projectName || "General AI System";

                await createOrLinkAiSystem(orgId, projectId, systemTitle, "Governance");
            }

            // 2. Save Policy (Legacy + New logic inside savePolicyData if we updated it, but for now keeping legacy working)
            await savePolicyData(policyData.data, policyData.level);

            toast({
                title: 'Richtlinie gespeichert!',
                description: 'Ihre Fortschritte wurden im Dashboard aktualisiert.'
            });

            // Redirect to Dashboard
            router.push('/dashboard');

        } catch (error) {
            console.error("Failed to save policy", error);
            toast({
                variant: 'destructive',
                title: 'Fehler beim Speichern',
                description: 'Bitte versuchen Sie es erneut.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        toast({
            title: 'Kopiert!',
            description: 'Der Link wurde in die Zwischenablage kopiert.'
        });
    }

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
                <div className="max-w-4xl mx-auto space-y-8">
                    {existingPolicyLevel && (
                        <Card className="bg-green-50 border-green-200 shadow-sm">
                            <CardContent className="flex items-center gap-4 py-4">
                                <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                                <div>
                                    <h3 className="font-semibold text-green-900">Policy Level {existingPolicyLevel} bereits aktiv</h3>
                                    <p className="text-sm text-green-700">
                                        Sie haben für dieses Organisation bereits {existingPolicyLastUpdated ? `am ${new Date(existingPolicyLastUpdated).toLocaleDateString()}` : ''} eine Policy erstellt.
                                    </p>
                                </div>
                                <Button variant="outline" className="ml-auto bg-green-50 border-green-300 hover:bg-green-100 text-green-800" onClick={() => router.push('/dashboard')}>
                                    Zum Dashboard
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                                        <Wand2 />
                                        Smart Policy Engine
                                    </CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        Erstellen Sie in wenigen Schritten eine verbindliche KI-Richtlinie für Ihr Unternehmen. Dieser Prozess hilft Ihnen, grundlegende Compliance-Anforderungen schnell und pragmatisch zu erfüllen.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p>
                                Beginnen Sie mit der Selbsteinschätzung, um die passende Richtlinien-Vorlage für Ihr Unternehmen zu finden. Füllen Sie die markierten Felder aus und schon haben Sie ein Dokument, das Sie intern verwenden und mit externen Partnern teilen können.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Dialog onOpenChange={(open) => !open && setShareUrl('')}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => policyData && handleShare()} disabled={!policyData} variant="outline">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Aktuelle Richtlinie teilen
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Richtlinie teilen</DialogTitle>
                                        <DialogDescription>
                                            Jeder mit diesem Link kann eine schreibgeschützte Version Ihrer Richtlinie sehen.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {isSharing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <p>Generiere Link...</p>
                                        </div>
                                    ) : shareUrl ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="share-url">Teilbarer Link</Label>
                                            <div className="flex gap-2">
                                                <Input id="share-url" value={shareUrl} readOnly />
                                                <Button onClick={handleCopy}>Kopieren</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>Link wird erstellt...</p>
                                    )}
                                </DialogContent>
                            </Dialog>
                            <Button onClick={() => handleSave()} disabled={!policyData || isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Richtlinie speichern & weiter
                            </Button>
                        </CardFooter>
                    </Card>

                    <PolicyEditor onPolicyChange={setPolicyData} onSave={handleSave} isSaving={isSaving} />

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
