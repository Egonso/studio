
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Loader2, Wand2, Share2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PolicyEditor, type PolicyData, type Level } from '@/components/policy-editor';
import { Button } from '@/components/ui/button';
import { createSharedPolicy } from '@/lib/data-service';
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
    const [shareUrl, setShareUrl] = useState('');
    const [policyData, setPolicyData] = useState<{data: PolicyData, level: Level} | null>(null);

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
                     <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                                        <Wand2 />
                                        Compliance-in-a-Day
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
                                    <Button onClick={() => policyData && handleShare()} disabled={!policyData}>
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
                                            <Loader2 className="h-4 w-4 animate-spin"/>
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
                        </CardFooter>
                    </Card>

                    <PolicyEditor onPolicyChange={setPolicyData} />

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
