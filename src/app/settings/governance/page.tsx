'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { registerService } from '@/lib/register-first/register-service';
import type { Register, OrgSettings, RoleEntry } from '@/lib/register-first/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ArrowLeft, Shield, Users, AlertTriangle, RefreshCw, GraduationCap, FileCheck2, Building } from 'lucide-react';
import { AccessCodeManager } from '@/components/register/access-code-manager';
import { FeatureGate } from '@/components/register/feature-gate';

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
    { value: 'INTERNAL' as const, label: 'Intern (eigene Mitarbeitende)' },
    { value: 'EXTERNAL' as const, label: 'Extern (Kunden, Öffentlichkeit)' },
    { value: 'PRODUCT_AI' as const, label: 'Produkt-KI (eigenes KI-Produkt)' },
    { value: 'SUPPLY_CHAIN' as const, label: 'Lieferkette (Zulieferer-KI)' },
] as const;

const RACI_ROLES = [
    { key: 'aiOwner' as const, label: 'KI-Verantwortliche:r (AI Owner)' },
    { key: 'complianceOwner' as const, label: 'Compliance Officer' },
    { key: 'technicalOwner' as const, label: 'Technische:r Verantwortliche:r' },
    { key: 'incidentOwner' as const, label: 'Incident-Verantwortliche:r' },
    { key: 'reviewOwner' as const, label: 'Review-Verantwortliche:r' },
    { key: 'dpo' as const, label: 'Datenschutzbeauftragte:r (DPO)' },
    { key: 'securityOfficer' as const, label: 'Informationssicherheit (CISO)' },
    { key: 'productOwner' as const, label: 'Product Owner' },
] as const;

function RoleInput({ role, value, onChange }: {
    role: { key: string; label: string };
    value: RoleEntry | null | undefined;
    onChange: (val: RoleEntry | null) => void;
}) {
    return (
        <div className="space-y-2 p-3 rounded-md border bg-muted/10">
            <div className="text-sm font-medium">{role.label}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                    placeholder="Name"
                    value={value?.name || ''}
                    onChange={(e) => onChange({ ...value, name: e.target.value, email: value?.email, department: value?.department })}
                />
                <Input
                    placeholder="E-Mail"
                    type="email"
                    value={value?.email || ''}
                    onChange={(e) => onChange({ ...value, name: value?.name || '', email: e.target.value, department: value?.department })}
                />
                <Input
                    placeholder="Abteilung"
                    value={value?.department || ''}
                    onChange={(e) => onChange({ ...value, name: value?.name || '', email: value?.email, department: e.target.value })}
                />
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function GovernanceSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [register, setRegister] = useState<Register | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // ── Free Fields ──────────────────────────────────────────────────────────
    const [orgName, setOrgName] = useState('');
    const [orgUnit, setOrgUnit] = useState('');
    const [industry, setIndustry] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // ── Existing Governance Framework (Free) ─────────────────────────────────
    const [aiPolicyUrl, setAiPolicyUrl] = useState('');
    const [aiPolicyOwner, setAiPolicyOwner] = useState('');
    const [aiPolicyReviewedAt, setAiPolicyReviewedAt] = useState('');
    const [incidentUrl, setIncidentUrl] = useState('');
    const [rolesUrl, setRolesUrl] = useState('');
    const [rolesDefined, setRolesDefined] = useState(false);
    const [reviewStandard, setReviewStandard] = useState<string>('risk-based');
    const [publicDisclosure, setPublicDisclosure] = useState(false);

    // ── Extended Settings (Pro) ──────────────────────────────────────────────
    const [scope, setScope] = useState<string[]>([]);
    const [raci, setRaci] = useState<Record<string, RoleEntry | null>>({});
    const [riskMethodology, setRiskMethodology] = useState<string>('basis');
    const [incidentReportingPath, setIncidentReportingPath] = useState('');
    const [incidentEscalation, setIncidentEscalation] = useState('');
    const [incidentDocRequired, setIncidentDocRequired] = useState(false);
    const [incidentTimeframe, setIncidentTimeframe] = useState('');
    const [reviewCycleType, setReviewCycleType] = useState<string>('risk_based');
    const [reviewCycleInterval, setReviewCycleInterval] = useState('');
    const [euAiActTraining, setEuAiActTraining] = useState(false);
    const [techAiCompetency, setTechAiCompetency] = useState(false);
    const [privacyTraining, setPrivacyTraining] = useState(false);
    const [incidentTraining, setIncidentTraining] = useState(false);
    const [iso27001, setIso27001] = useState(false);
    const [iso42001, setIso42001] = useState(false);

    // ── Load ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) { router.push('/login'); return; }

        registerService.getFirstRegister()
            .then((reg) => {
                if (reg) {
                    setRegister(reg);
                    setOrgName(reg.organisationName || '');
                    setOrgUnit(reg.organisationUnit || '');
                    setPublicDisclosure(reg.publicOrganisationDisclosure || false);

                    const s = reg.orgSettings;
                    if (s) {
                        setIndustry(s.industry || '');
                        setContactName(s.contactPerson?.name || '');
                        setContactEmail(s.contactPerson?.email || '');
                        setAiPolicyUrl(s.aiPolicy?.url || '');
                        setAiPolicyOwner(s.aiPolicy?.owner || '');
                        setAiPolicyReviewedAt(s.aiPolicy?.lastReviewedAt || '');
                        setIncidentUrl(s.incidentProcess?.url || '');
                        setRolesUrl(s.rolesFramework?.docUrl || '');
                        setRolesDefined(s.rolesFramework?.booleanDefined || false);
                        setReviewStandard(s.reviewStandard || 'risk-based');

                        // Extended
                        setScope(s.scope || []);
                        if (s.raci) {
                            const r: Record<string, RoleEntry | null> = {};
                            for (const role of RACI_ROLES) {
                                r[role.key] = s.raci[role.key] || null;
                            }
                            setRaci(r);
                        }
                        setRiskMethodology(s.riskMethodology || 'basis');
                        setIncidentReportingPath(s.incidentConfig?.reportingPath || '');
                        setIncidentEscalation(s.incidentConfig?.escalationLevel || '');
                        setIncidentDocRequired(s.incidentConfig?.documentationRequired || false);
                        setIncidentTimeframe(s.incidentConfig?.responseTimeframe || '');
                        setReviewCycleType(s.reviewCycle?.type || 'risk_based');
                        setReviewCycleInterval(s.reviewCycle?.interval || '');
                        setEuAiActTraining(s.competencyMatrix?.euAiActTrainingRequired || false);
                        setTechAiCompetency(s.competencyMatrix?.technicalAiCompetency || false);
                        setPrivacyTraining(s.competencyMatrix?.dataPrivacyTraining || false);
                        setIncidentTraining(s.competencyMatrix?.incidentTraining || false);
                        setIso27001(s.isoFlags?.iso27001Alignment || false);
                        setIso42001(s.isoFlags?.iso42001Preparation || false);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [user, router]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!register) return;
        setIsSaving(true);
        try {
            const raciData: OrgSettings['raci'] = {};
            for (const role of RACI_ROLES) {
                const entry = raci[role.key];
                raciData[role.key] = entry?.name ? entry : null;
            }

            const orgSettings: OrgSettings = {
                organisationName: orgName.trim(),
                industry: industry.trim(),
                contactPerson: { name: contactName.trim(), email: contactEmail.trim() },
                aiPolicy: aiPolicyUrl.trim() ? { url: aiPolicyUrl.trim(), owner: aiPolicyOwner.trim(), lastReviewedAt: aiPolicyReviewedAt.trim() } : null,
                incidentProcess: incidentUrl.trim() ? { url: incidentUrl.trim() } : null,
                rolesFramework: rolesUrl.trim() || rolesDefined ? { docUrl: rolesUrl.trim(), booleanDefined: rolesDefined } : null,
                reviewStandard: reviewStandard as OrgSettings['reviewStandard'],
                // Extended
                scope: scope as OrgSettings['scope'],
                raci: raciData,
                riskMethodology: riskMethodology as OrgSettings['riskMethodology'],
                incidentConfig: {
                    reportingPath: incidentReportingPath.trim(),
                    escalationLevel: incidentEscalation.trim(),
                    documentationRequired: incidentDocRequired,
                    responseTimeframe: incidentTimeframe.trim(),
                },
                reviewCycle: {
                    type: reviewCycleType as 'fixed' | 'risk_based' | 'event_based',
                    interval: reviewCycleInterval.trim(),
                },
                competencyMatrix: {
                    euAiActTrainingRequired: euAiActTraining,
                    technicalAiCompetency: techAiCompetency,
                    dataPrivacyTraining: privacyTraining,
                    incidentTraining: incidentTraining,
                },
                isoFlags: {
                    iso27001Alignment: iso27001,
                    iso42001Preparation: iso42001,
                },
            };

            await registerService.updateRegisterProfile(register.registerId, {
                organisationName: orgName.trim() || null,
                organisationUnit: orgUnit.trim() || null,
                publicOrganisationDisclosure: publicDisclosure,
                orgSettings,
            });

            toast({ title: "Einstellungen gespeichert", description: "Governance-Einstellungen aktualisiert." });
        } catch {
            toast({ variant: "destructive", title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden." });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Toggle Scope Checkbox ────────────────────────────────────────────────
    const toggleScope = (val: string) => {
        setScope(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };

    // ── Loading / Auth Guard ─────────────────────────────────────────────────
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
                    <Button variant="ghost" size="icon" onClick={() => router.push('/my-register')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Governance-Einstellungen</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Organisationsweite Vorgaben für Ihre KI-Governance. Erweiterte Einstellungen wachsen mit Ihrem Bedarf.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Änderungen speichern
                    </Button>
                </div>

                <Accordion type="multiple" defaultValue={['identity', 'governance-framework']} className="space-y-3">

                    {/* ─── 1. ORGANISATIONSDATEN (Free) ─────────────────────────────── */}
                    <AccordionItem value="identity" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Organisationsdaten</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <div className="space-y-4">
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
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 2. GOVERNANCE-RAHMEN (Free) ──────────────────────────────── */}
                    <AccordionItem value="governance-framework" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Governance-Rahmen (Makro-Ebene)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <div className="space-y-6">
                                <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                                    <div className="font-medium text-sm">KI-Richtlinie (AI Policy)</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label>Dokumenten-URL</Label>
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

                                <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                                    <div className="font-medium text-sm">Incident Management</div>
                                    <div className="space-y-1.5">
                                        <Label>Prozess-URL (für KI-Vorfälle)</Label>
                                        <Input value={incidentUrl} onChange={(e) => setIncidentUrl(e.target.value)} placeholder="https://" />
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-md border bg-muted/20">
                                    <div className="font-medium text-sm">Rollen & Verantwortlichkeiten</div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="gs-roles" checked={rolesDefined} onCheckedChange={(c) => setRolesDefined(c === true)} />
                                        <Label htmlFor="gs-roles" className="text-sm">Sind KI-spezifische Rollen formal verteilt?</Label>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Rollen-Dokument-URL (optional)</Label>
                                        <Input value={rolesUrl} onChange={(e) => setRolesUrl(e.target.value)} disabled={!rolesDefined} placeholder="https://" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Globale Mindest-Reviewfrequenz</Label>
                                    <Select value={reviewStandard} onValueChange={setReviewStandard}>
                                        <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="annual">Einmal jährlich</SelectItem>
                                            <SelectItem value="semiannual">Halbjährlich</SelectItem>
                                            <SelectItem value="risk-based">Risikobasiert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 3. GELTUNGSBEREICH / SCOPE (Pro) ─────────────────────────── */}
                    <AccordionItem value="scope" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Geltungsbereich (Scope)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <FeatureGate feature="extendedOrgSettings" mode="overlay">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        In welchen Bereichen setzt Ihre Organisation KI ein? Mehrfachauswahl möglich.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {SCOPE_OPTIONS.map(opt => (
                                            <div key={opt.value} className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox
                                                    id={`scope-${opt.value}`}
                                                    checked={scope.includes(opt.value)}
                                                    onCheckedChange={() => toggleScope(opt.value)}
                                                />
                                                <Label htmlFor={`scope-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label>Risikobewertungs-Methodik</Label>
                                        <Select value={riskMethodology} onValueChange={setRiskMethodology}>
                                            <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="basis">Basis (EUKI Standard)</SelectItem>
                                                <SelectItem value="extended">Erweitert (+ Impact Assessment)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </FeatureGate>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 4. ROLLEN & VERANTWORTLICHKEITEN - RACI (Pro) ───────────── */}
                    <AccordionItem value="raci" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Rollen-Matrix (RACI)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <FeatureGate feature="extendedOrgSettings" mode="overlay">
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Definieren Sie, wer für welche Governance-Aufgabe verantwortlich ist. Diese Zuordnungen werden automatisch auf neue Use Cases vererbt.
                                    </p>
                                    {RACI_ROLES.map(role => (
                                        <RoleInput
                                            key={role.key}
                                            role={role}
                                            value={raci[role.key]}
                                            onChange={(val) => setRaci(prev => ({ ...prev, [role.key]: val }))}
                                        />
                                    ))}
                                </div>
                            </FeatureGate>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 5. INCIDENT-KONFIGURATION (Pro) ──────────────────────────── */}
                    <AccordionItem value="incident-config" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Incident-Konfiguration</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <FeatureGate feature="extendedOrgSettings" mode="overlay">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Wie werden KI-bezogene Vorfälle gehandhabt? Diese Einstellungen gelten organisationsweit.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Meldeweg</Label>
                                            <Input value={incidentReportingPath} onChange={(e) => setIncidentReportingPath(e.target.value)} placeholder="z. B. Compliance-Team per E-Mail" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Eskalationsstufe</Label>
                                            <Input value={incidentEscalation} onChange={(e) => setIncidentEscalation(e.target.value)} placeholder="z. B. Team → Abteilung → Vorstand" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Reaktionszeitrahmen</Label>
                                            <Input value={incidentTimeframe} onChange={(e) => setIncidentTimeframe(e.target.value)} placeholder="z. B. 72 Stunden" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <Checkbox id="inc-doc" checked={incidentDocRequired} onCheckedChange={(c) => setIncidentDocRequired(c === true)} />
                                        <Label htmlFor="inc-doc" className="text-sm">Dokumentationspflicht bei jedem Vorfall</Label>
                                    </div>
                                </div>
                            </FeatureGate>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 6. REVIEW-LOGIK (Pro) ────────────────────────────────────── */}
                    <AccordionItem value="review-logic" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Review-Logik</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <FeatureGate feature="extendedOrgSettings" mode="overlay">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Review-Typ</Label>
                                        <Select value={reviewCycleType} onValueChange={setReviewCycleType}>
                                            <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fester Zyklus</SelectItem>
                                                <SelectItem value="risk_based">Risikobasiert</SelectItem>
                                                <SelectItem value="event_based">Eventbasiert</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {reviewCycleType === 'fixed' && (
                                        <div className="space-y-1.5">
                                            <Label>Intervall</Label>
                                            <Input value={reviewCycleInterval} onChange={(e) => setReviewCycleInterval(e.target.value)} placeholder="z. B. Alle 6 Monate" />
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {reviewCycleType === 'risk_based'
                                            ? 'Hochrisiko-Systeme werden häufiger reviewed, Systeme mit minimalem Risiko seltener.'
                                            : reviewCycleType === 'event_based'
                                                ? 'Reviews werden durch Ereignisse ausgelöst: Vorfälle, Regeländerungen, wesentliche Systemänderungen.'
                                                : 'Alle Systeme werden im gleichen festen Rhythmus überprüft.'}
                                    </p>
                                </div>
                            </FeatureGate>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 7. KOMPETENZ & ISO (Pro) ─────────────────────────────────── */}
                    <AccordionItem value="competency-iso" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Kompetenz & ISO Alignment</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <FeatureGate feature="extendedOrgSettings" mode="overlay">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="font-medium text-sm">Kompetenzanforderungen</div>
                                        <p className="text-xs text-muted-foreground">Welche Schulungen setzt Ihre Organisation für KI-Verantwortliche voraus?</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="comp-euai" checked={euAiActTraining} onCheckedChange={(c) => setEuAiActTraining(c === true)} />
                                                <Label htmlFor="comp-euai" className="text-sm cursor-pointer">EU AI Act Schulung</Label>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="comp-tech" checked={techAiCompetency} onCheckedChange={(c) => setTechAiCompetency(c === true)} />
                                                <Label htmlFor="comp-tech" className="text-sm cursor-pointer">Technische KI-Kompetenz</Label>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="comp-priv" checked={privacyTraining} onCheckedChange={(c) => setPrivacyTraining(c === true)} />
                                                <Label htmlFor="comp-priv" className="text-sm cursor-pointer">Datenschutz-Schulung</Label>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="comp-inc" checked={incidentTraining} onCheckedChange={(c) => setIncidentTraining(c === true)} />
                                                <Label htmlFor="comp-inc" className="text-sm cursor-pointer">Incident-Training</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t">
                                        <div className="font-medium text-sm pt-3">ISO Alignment</div>
                                        <p className="text-xs text-muted-foreground">Optionale Ausrichtung an ISO-Standards für erweiterte Audit-Nachweise.</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="iso-27001" checked={iso27001} onCheckedChange={(c) => setIso27001(c === true)} />
                                                <div>
                                                    <Label htmlFor="iso-27001" className="text-sm cursor-pointer font-medium">ISO 27001 Alignment</Label>
                                                    <p className="text-xs text-muted-foreground">Informationssicherheit – relevante Controls werden im Audit-Export gemappt.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
                                                <Checkbox id="iso-42001" checked={iso42001} onCheckedChange={(c) => setIso42001(c === true)} />
                                                <div>
                                                    <Label htmlFor="iso-42001" className="text-sm cursor-pointer font-medium">ISO 42001 Vorbereitung</Label>
                                                    <p className="text-xs text-muted-foreground">KI-Management-System – strukturiertes Governance für KI nach internationalem Standard.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FeatureGate>
                        </AccordionContent>
                    </AccordionItem>

                    {/* ─── 8. ERWEITERTE STEUERUNG (Free) ──────────────────────────── */}
                    <AccordionItem value="advanced" className="border rounded-lg px-1">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Erweiterte Steuerung & Zugangscodes</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                            <div className="space-y-6">
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
                                            Wenn aktiviert, erscheint der Organisationsname auf der öffentlichen Verify-Seite.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="font-medium text-sm">Zugangscodes für Teammitglieder</div>
                                    <AccessCodeManager registerId={register.registerId} />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </main>
        </div>
    );
}
