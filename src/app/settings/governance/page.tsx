'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { registerService } from '@/lib/register-first/register-service';
import type { Register, OrgSettings } from '@/lib/register-first/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AccessCodeManager } from '@/components/register/access-code-manager';

export default function GovernanceSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [register, setRegister] = useState<Register | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [orgName, setOrgName] = useState('');
    const [orgUnit, setOrgUnit] = useState('');
    const [industry, setIndustry] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // Governance Framework State
    const [aiPolicyUrl, setAiPolicyUrl] = useState('');
    const [aiPolicyOwner, setAiPolicyOwner] = useState('');
    const [aiPolicyReviewedAt, setAiPolicyReviewedAt] = useState('');

    const [incidentUrl, setIncidentUrl] = useState('');

    const [rolesUrl, setRolesUrl] = useState('');
    const [rolesDefined, setRolesDefined] = useState(false);

    const [reviewStandard, setReviewStandard] = useState<string>('risk-based');

    // Advanced Controls State
    const [publicDisclosure, setPublicDisclosure] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        registerService.getFirstRegister()
            .then((reg) => {
                if (reg) {
                    setRegister(reg);
                    setOrgName(reg.organisationName || '');
                    setOrgUnit(reg.organisationUnit || '');
                    setPublicDisclosure(reg.publicOrganisationDisclosure || false);

                    if (reg.orgSettings) {
                        setIndustry(reg.orgSettings.industry || '');
                        setContactName(reg.orgSettings.contactPerson?.name || '');
                        setContactEmail(reg.orgSettings.contactPerson?.email || '');

                        setAiPolicyUrl(reg.orgSettings.aiPolicy?.url || '');
                        setAiPolicyOwner(reg.orgSettings.aiPolicy?.owner || '');
                        setAiPolicyReviewedAt(reg.orgSettings.aiPolicy?.lastReviewedAt || '');

                        setIncidentUrl(reg.orgSettings.incidentProcess?.url || '');

                        setRolesUrl(reg.orgSettings.rolesFramework?.docUrl || '');
                        setRolesDefined(reg.orgSettings.rolesFramework?.booleanDefined || false);

                        setReviewStandard(reg.orgSettings.reviewStandard || 'risk-based');
                    }
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [user, router]);

    const handleSave = async () => {
        if (!register) return;
        setIsSaving(true);
        try {
            const orgSettings: OrgSettings = {
                organisationName: orgName.trim(),
                industry: industry.trim(),
                contactPerson: {
                    name: contactName.trim(),
                    email: contactEmail.trim(),
                },
                aiPolicy: aiPolicyUrl.trim() ? {
                    url: aiPolicyUrl.trim(),
                    owner: aiPolicyOwner.trim(),
                    lastReviewedAt: aiPolicyReviewedAt.trim()
                } : null,
                incidentProcess: incidentUrl.trim() ? {
                    url: incidentUrl.trim()
                } : null,
                rolesFramework: rolesUrl.trim() || rolesDefined ? {
                    docUrl: rolesUrl.trim(),
                    booleanDefined: rolesDefined
                } : null,
                reviewStandard: reviewStandard as any
            };

            await registerService.updateRegisterProfile(register.registerId, {
                organisationName: orgName.trim() || null,
                organisationUnit: orgUnit.trim() || null,
                publicOrganisationDisclosure: publicDisclosure,
                orgSettings
            });

            toast({
                title: "Einstellungen gespeichert",
                description: "Globale Governance-Einstellungen aktualisiert.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Einstellungen konnten nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </main>
            </div>
        );
    }

    if (!register) return null;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 space-y-6">

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Governance-Einstellungen</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Verwalten Sie organisationale Vorgaben und Makro-Steuerungen für alle KI-Systeme.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Änderungen speichern
                    </Button>
                </div>

                {/* 1. Identity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Organisations-Identität</CardTitle>
                        <CardDescription>
                            Grunddaten zu Ihrer Organisation und Ihrem Verantwortungsbereich.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Organisation</Label>
                                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="z. B. Müller GmbH" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Organisationseinheit (optional)</Label>
                                <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="z. B. Marketing" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Branche</Label>
                                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="z. B. Technologie" />
                            </div>
                        </div>

                        <div className="pt-2 text-sm font-medium">Primärer Ansprechpartner</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Name</Label>
                                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Vor- und Nachname" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>E-Mail</Label>
                                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@firma.de" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Governance-Rahmen */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Governance-Rahmen (Makro-Ebene)</CardTitle>
                        <CardDescription>
                            Verlinken Sie Ihre globalen Richtlinien. Diese werden in allen Prüfungen als fundamentale Struktur vorausgesetzt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* AI Policy */}
                        <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                            <div className="font-medium text-sm">KI-Richtlinie (AI Policy)</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Dokumenten-URL (SharePoint, Confluence, etc.)</Label>
                                    <Input value={aiPolicyUrl} onChange={(e) => setAiPolicyUrl(e.target.value)} placeholder="https://" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Owner / Verantwortlich</Label>
                                    <Input value={aiPolicyOwner} onChange={(e) => setAiPolicyOwner(e.target.value)} placeholder="z. B. Legal, CISO" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Letztes Review-Datum</Label>
                                    <Input value={aiPolicyReviewedAt} type="date" onChange={(e) => setAiPolicyReviewedAt(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Incident Process */}
                        <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                            <div className="font-medium text-sm">Incident Management</div>
                            <div className="space-y-1.5">
                                <Label>Prozess-URL (für KI-Vorfälle)</Label>
                                <Input value={incidentUrl} onChange={(e) => setIncidentUrl(e.target.value)} placeholder="https://" />
                            </div>
                        </div>

                        {/* Roles */}
                        <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                            <div className="font-medium text-sm">Rollen & Verantwortlichkeiten (RACI)</div>
                            <div className="flex items-center gap-3">
                                <Checkbox id="gs-roles" checked={rolesDefined} onCheckedChange={(c) => setRolesDefined(c === true)} />
                                <Label htmlFor="gs-roles" className="text-sm">Sind KI-spezifische Rollen in der Organisation formal verteilt?</Label>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Rollen-Dokument-URL (optional)</Label>
                                <Input value={rolesUrl} onChange={(e) => setRolesUrl(e.target.value)} disabled={!rolesDefined} placeholder="https://" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Globale Mindest-Reviewfrequenz</Label>
                            <Select value={reviewStandard} onValueChange={setReviewStandard}>
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="annual">Einmal jährlich (Annual)</SelectItem>
                                    <SelectItem value="semiannual">Halbjährlich (Semiannual)</SelectItem>
                                    <SelectItem value="risk-based">Risikobasiert (Risk-based)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Wie oft sollen KI-Systeme standardmäßig re-evaluiert werden? Systeme mit höherem Risiko können kürzere lokale Zyklen haben.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Erweiterte Steuerung */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Erweiterte Steuerung</CardTitle>
                        <CardDescription>
                            Zugriffsrechte und öffentliche Sichtbarkeit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="flex items-start gap-3 rounded-md border p-4">
                            <Checkbox
                                id="gs-disclosure"
                                checked={publicDisclosure}
                                onCheckedChange={(checked) => setPublicDisclosure(checked === true)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="gs-disclosure" className="text-sm font-medium leading-none">
                                    Organisation öffentlich anzeigen
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Wenn dies aktiviert ist, erscheint der Organisationsname auf der öffentlichen Verify-Seite für Use Cases, die auf 'Öffentlich' gesetzt wurden.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="font-medium text-sm">Zugangscodes für Teammitglieder</div>
                            <AccessCodeManager registerId={register.registerId} />
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
