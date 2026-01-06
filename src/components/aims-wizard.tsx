
'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Loader2, PlusCircle, Trash2, ChevronsRight, Info, CheckCircle2 } from "lucide-react";
import { getAimsData, saveAimsData, getActiveProjectId, type AimsProgress } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const TOTAL_STEPS = 6;

// --- Data Types ---
interface Stakeholder {
    id: string;
    name: string;
    expectation: string;
    influence: 'low' | 'medium' | 'high' | '';
    risk: string;
    opportunity: string;
}

interface RaciRow {
    id: string;
    task: string;
    responsible: string;
    accountable: string;
    consulted: string;
    informed: string;
}

interface Risk {
    id: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | '';
    likelihood: 'low' | 'medium' | 'high' | '';
    controls: string;
    measures: string;
}

interface AimsData {
    scope: string;
    systems: string;
    factors: string;
    departments: string;
    stakeholders: Stakeholder[];
    policy: string;
    raci: RaciRow[];
    risks: Risk[];
    kpis: string;
    monitoringProcess: string;
    auditRhythm: string;
    improvementProcess: string;
}

const initialAimsData: AimsData = {
    scope: '',
    systems: '',
    factors: '',
    departments: '',
    stakeholders: [{ id: '1', name: '', expectation: '', influence: '', risk: '', opportunity: '' }],
    policy: '',
    raci: [{ id: '1', task: '', responsible: '', accountable: '', consulted: '', informed: '' }],
    risks: [{ id: '1', description: '', impact: '', likelihood: '', controls: '', measures: '' }],
    kpis: '',
    monitoringProcess: '',
    auditRhythm: '',
    improvementProcess: '',
};

const validateStep = (step: number, data: AimsData): boolean => {
    switch (step) {
        case 1:
            return !!data.scope && !!data.systems;
        case 2:
            return data.stakeholders.length > 0 && data.stakeholders.every(s => !!s.name && !!s.expectation && !!s.influence);
        case 3:
            return data.policy.length >= 20;
        case 4:
            return data.raci.length > 0 && data.raci.every(r => !!r.task && !!r.responsible && !!r.accountable);
        case 5:
            return data.risks.length > 0 && data.risks.every(r => !!r.description && !!r.impact && !!r.likelihood);
        case 6:
            return !!data.kpis || !!data.monitoringProcess || !!data.auditRhythm;
        default:
            return false;
    }
}

interface AimsWizardProps {
    initialStep?: number;
    onComplete?: () => void;
}

export function AimsWizard({ initialStep = 1, onComplete }: AimsWizardProps) {
    const [step, setStep] = useState(initialStep);
    const [data, setData] = useState<AimsData>(initialAimsData);
    const [progress, setProgress] = useState<AimsProgress>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    // Use a flag to track if initial step was set from props, but actually we can just trust prop for initial render.
    // However, if we load data from DB, we shouldn't auto-jump steps unless specifically asked relative to data status.
    // The "controller" page handles determining the step, so we just respect initialStep here.

    // BUT: useEffect below was overwriting data.

    useEffect(() => {
        const loadData = async () => {
            if (getActiveProjectId()) {
                const savedData = await getAimsData();
                if (savedData) {
                    setData(prev => ({ ...prev, ...savedData }));
                }
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    // Sync initialStep if it changes (optional, but good for reactiveness if controller re-evaluates)
    useEffect(() => {
        setStep(initialStep);
    }, [initialStep]);

    const calculateProgress = (currentData: AimsData): AimsProgress => {
        return {
            step1_complete: validateStep(1, currentData),
            step2_complete: validateStep(2, currentData),
            step3_complete: validateStep(3, currentData),
            step4_complete: validateStep(4, currentData),
            step5_complete: validateStep(5, currentData),
            step6_complete: validateStep(6, currentData),
        }
    }

    useEffect(() => {
        setProgress(calculateProgress(data));
        setValidationError(false);
    }, [data]);

    const handleSave = async (showToast: boolean = true) => {
        setIsSaving(true);
        await saveAimsData(data, progress);
        setIsSaving(false);
        if (showToast) {
            toast({ title: "Fortschritt gespeichert!", description: "Ihre Eingaben wurden gesichert." });
        }
    };

    const nextStep = () => {
        if (validateStep(step, data)) {
            setValidationError(false);
            if (step < TOTAL_STEPS) setStep(s => s + 1);
        } else {
            setValidationError(true);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setValidationError(false);
            setStep(s => s - 1);
        }
    };

    const handleFinish = async () => {
        await handleSave(false);
        if (onComplete) {
            onComplete();
        } else {
            setStep(TOTAL_STEPS + 1); // Go to final screen if no callback
        }
    }

    const completedSteps = Object.values(progress).filter(v => v === true).length;
    const progressPercentage = (completedSteps / TOTAL_STEPS) * 100;

    const handleStakeholderChange = <K extends keyof Stakeholder>(index: number, field: K, value: Stakeholder[K]) => {
        const newStakeholders = [...data.stakeholders];
        newStakeholders[index][field] = value;
        setData(prev => ({ ...prev, stakeholders: newStakeholders }));
    };

    const addStakeholder = () => {
        setData(prev => ({ ...prev, stakeholders: [...prev.stakeholders, { id: Date.now().toString(), name: '', expectation: '', influence: '', risk: '', opportunity: '' }] }));
    };

    const removeStakeholder = (index: number) => {
        setData(prev => ({ ...prev, stakeholders: prev.stakeholders.filter((_, i) => i !== index) }));
    };

    const handleRaciChange = <K extends keyof RaciRow>(index: number, field: K, value: RaciRow[K]) => {
        const newRaci = [...data.raci];
        newRaci[index][field] = value;
        setData(prev => ({ ...prev, raci: newRaci }));
    };

    const addRaciRow = () => {
        setData(prev => ({ ...prev, raci: [...prev.raci, { id: Date.now().toString(), task: '', responsible: '', accountable: '', consulted: '', informed: '' }] }));
    };

    const removeRaciRow = (index: number) => {
        setData(prev => ({ ...prev, raci: prev.raci.filter((_, i) => i !== index) }));
    };

    const handleRiskChange = <K extends keyof Risk>(index: number, field: K, value: Risk[K]) => {
        const newRisks = [...data.risks];
        newRisks[index][field] = value;
        setData(prev => ({ ...prev, risks: newRisks }));
    };

    const addRisk = () => {
        setData(prev => ({ ...prev, risks: [...prev.risks, { id: Date.now().toString(), description: '', impact: '', likelihood: '', controls: '', measures: '' }] }));
    };

    const removeRisk = (index: number) => {
        setData(prev => ({ ...prev, risks: prev.risks.filter((_, i) => i !== index) }));
    };

    if (isLoading) {
        return <Loader2 className="h-8 w-8 animate-spin" />
    }

    if (step > TOTAL_STEPS) {
        return (
            <Card className="w-full max-w-2xl shadow-lg mt-8">
                <CardHeader>
                    <CardTitle>AI Management System erstellt</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Sie haben die wichtigsten Bausteine Ihres AI-Managementsystems nach ISO 42001 definiert. Ihre Angaben werden nun im Dashboard sichtbar.</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push(`/dashboard?projectId=${getActiveProjectId()}`)}>Zurück zum Dashboard</Button>
                    <Button onClick={() => router.push(`/ai-management`)}>ISO 42001 ansehen</Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-4xl shadow-md mt-8">
            <CardHeader>
                <div className="mb-4">
                    <p className="font-semibold text-gray-700 flex justify-between items-center">
                        <span>Schritt {step} von {TOTAL_STEPS}</span>
                        {(progress as any)[`step${step}_complete`] && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Bereits erledigt
                            </span>
                        )}
                    </p>
                    <Progress value={progressPercentage} className="mt-2 w-full" />
                </div>
                <CardTitle>AI Management System Setup (ISO 42001)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key={1} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Kontext & Geltungsbereich</h3>
                            <p className="text-sm text-gray-700 mb-4">Definieren Sie, für welche KI-Systeme und Prozesse das AI-Managementsystem gelten soll.</p>
                            <div className="space-y-2">
                                <Label htmlFor="scope">Geltungsbereich Ihres AI-Managementsystems (*)</Label>
                                <Textarea id="scope" placeholder="z.B. Alle KI-gestützten Kundeninteraktionen in der EU..." value={data.scope} onChange={(e) => setData({ ...data, scope: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="systems">Welche KI-Systeme sind im Einsatz? (*)</Label>
                                <Input id="systems" placeholder="z.B. ChatGPT, Interner Chatbot, HR-Analyse-Tool" value={data.systems} onChange={(e) => setData({ ...data, systems: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="factors">Interne & externe relevante Faktoren</Label>
                                <Textarea id="factors" placeholder="Politisch (z.B. neue Gesetze), rechtlich (z.B. DSGVO), technologisch (z.B. neue KI-Modelle)..." value={data.factors} onChange={(e) => setData({ ...data, factors: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="departments">Betroffene Abteilungen</Label>
                                <Input id="departments" placeholder="z.B. Marketing, HR, IT, Kundenservice" value={data.departments} onChange={(e) => setData({ ...data, departments: e.target.value })} />
                            </div>
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div key={2} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Stakeholder & Anforderungen</h3>
                            <p className="text-sm text-gray-700 mb-4">Identifizieren Sie Personen und Gruppen, die von Ihrem KI-Einsatz betroffen sind.</p>
                            {data.stakeholders.map((stakeholder, index) => (
                                <Card key={stakeholder.id} className="p-4 bg-secondary border-gray-200 mt-4 shadow-sm">
                                    <CardContent className="space-y-3 p-0">
                                        <div className="flex justify-between items-center">
                                            <Label className="font-semibold text-gray-700">Stakeholder #{index + 1}</Label>
                                            <Button variant="ghost" size="icon" onClick={() => removeStakeholder(index)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-destructive transition-colors" /></Button>
                                        </div>
                                        <Input placeholder="Name / Gruppe (*)" value={stakeholder.name} onChange={(e) => handleStakeholderChange(index, 'name', e.target.value)} />
                                        <Textarea placeholder="Erwartung / Interesse (*)" value={stakeholder.expectation} onChange={(e) => handleStakeholderChange(index, 'expectation', e.target.value)} rows={2} />
                                        <Select value={stakeholder.influence} onValueChange={(v: any) => handleStakeholderChange(index, 'influence', v)}>
                                            <SelectTrigger><SelectValue placeholder="Einfluss (*)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">Hoch</SelectItem>
                                                <SelectItem value="medium">Mittel</SelectItem>
                                                <SelectItem value="low">Niedrig</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input placeholder="Risiko bei Nichterfüllung" value={stakeholder.risk} onChange={(e) => handleStakeholderChange(index, 'risk', e.target.value)} />
                                        <Input placeholder="Chance bei Erfüllung" value={stakeholder.opportunity} onChange={(e) => handleStakeholderChange(index, 'opportunity', e.target.value)} />
                                    </CardContent>
                                </Card>
                            ))}
                            <Button variant="outline" onClick={addStakeholder} className="w-full mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Stakeholder hinzufügen</Button>
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div key={3} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Grundlegende KI-Policy</h3>
                            <p className="text-sm text-gray-700 mb-4">Formulieren Sie die Leitlinien für den verantwortungsvollen KI-Einsatz. (Mindestens 20 Zeichen)</p>
                            <Textarea className="min-h-[300px]" placeholder="Beschreiben Sie Prinzipien zu Sicherheit, Transparenz, Fairness, Verantwortlichkeiten..." value={data.policy} onChange={(e) => setData({ ...data, policy: e.target.value })} />
                        </motion.div>
                    )}
                    {step === 4 && (
                        <motion.div key={4} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Rollen & Verantwortlichkeiten (RACI)</h3>
                            <p className="text-sm text-gray-700 mb-4">Legen Sie fest, wer für welche AI-Governance-Aufgabe verantwortlich ist.</p>
                            <div className="space-y-2">
                                {data.raci.map((row, index) => (
                                    <div key={row.id} className="grid grid-cols-[1fr_auto] items-end gap-2 p-2 border border-gray-200 rounded-lg bg-secondary">
                                        <div className="grid grid-cols-5 gap-2">
                                            <Input placeholder="Aufgabe (*)" value={row.task} onChange={(e) => handleRaciChange(index, 'task', e.target.value)} />
                                            <Input placeholder="Responsible (*)" value={row.responsible} onChange={(e) => handleRaciChange(index, 'responsible', e.target.value)} />
                                            <Input placeholder="Accountable (*)" value={row.accountable} onChange={(e) => handleRaciChange(index, 'accountable', e.target.value)} />
                                            <Input placeholder="Consulted" value={row.consulted} onChange={(e) => handleRaciChange(index, 'consulted', e.target.value)} />
                                            <Input placeholder="Informed" value={row.informed} onChange={(e) => handleRaciChange(index, 'informed', e.target.value)} />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeRaciRow(index)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-destructive transition-colors" /></Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={addRaciRow} className="w-full mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Aufgabe hinzufügen</Button>
                        </motion.div>
                    )}
                    {step === 5 && (
                        <motion.div key={5} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Risikomanagement nach ISO 42001</h3>
                            <p className="text-sm text-gray-700 mb-4">Analysieren Sie Risiken und Chancen im Zusammenhang mit Ihren KI-Systemen.</p>
                            <TooltipProvider>
                                {data.risks.map((risk, index) => (
                                    <Card key={risk.id} className="p-4 bg-secondary border-gray-200 mt-4 shadow-sm">
                                        <CardContent className="space-y-3 p-0">
                                            <div className="flex justify-between items-center">
                                                <Label className="font-semibold text-gray-700">Risiko #{index + 1}</Label>
                                                <Button variant="ghost" size="icon" onClick={() => removeRisk(index)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-destructive transition-colors" /></Button>
                                            </div>
                                            <Textarea placeholder="Risiko-Beschreibung (*)" value={risk.description} onChange={(e) => handleRiskChange(index, 'description', e.target.value)} rows={2} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Label className="flex items-center gap-1 cursor-help">Auswirkung (*)</Label>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Wie stark wäre die Auswirkung, wenn das Risiko eintritt?</p></TooltipContent>
                                                    </Tooltip>
                                                    <Select value={risk.impact} onValueChange={(v: any) => handleRiskChange(index, 'impact', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Auswirkung..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">Hoch</SelectItem>
                                                            <SelectItem value="medium">Mittel</SelectItem>
                                                            <SelectItem value="low">Niedrig</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Label className="flex items-center gap-1 cursor-help">Eintrittswahrscheinlichkeit (*)</Label>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Wie wahrscheinlich ist der Eintritt dieses Risikos?</p></TooltipContent>
                                                    </Tooltip>
                                                    <Select value={risk.likelihood} onValueChange={(v: any) => handleRiskChange(index, 'likelihood', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Wahrscheinlichkeit..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">Hoch</SelectItem>
                                                            <SelectItem value="medium">Mittel</SelectItem>
                                                            <SelectItem value="low">Niedrig</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Textarea placeholder="Bestehende Kontrollen" value={risk.controls} onChange={(e) => handleRiskChange(index, 'controls', e.target.value)} rows={2} />
                                            <Textarea placeholder="Geplante Maßnahmen" value={risk.measures} onChange={(e) => handleRiskChange(index, 'measures', e.target.value)} rows={2} />
                                        </CardContent>
                                    </Card>
                                ))}
                            </TooltipProvider>
                            <Button variant="outline" onClick={addRisk} className="w-full mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Risiko hinzufügen</Button>
                        </motion.div>
                    )}
                    {step === 6 && (
                        <motion.div key={6} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-4">
                            <h3 className="font-semibold text-lg">Monitoring, KPIs & Verbesserungsprozess</h3>
                            <p className="text-sm text-gray-700 mb-4">Legen Sie fest, wie Sie den KI-Einsatz überwachen und kontinuierlich verbessern.</p>
                            <div className="space-y-2">
                                <Label htmlFor="kpis">KPIs zur Leistung</Label>
                                <Textarea id="kpis" placeholder="z.B. Genauigkeit der Vorhersagen, Nutzerzufriedenheit, Anzahl der menschlichen Eingriffe..." value={data.kpis} onChange={(e) => setData({ ...data, kpis: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="monitoring">Monitoring-Prozess</Label>
                                <Textarea id="monitoring" placeholder="z.B. Wöchentliches Review der KPI-Dashboards, monatliche Analyse von Ausreißern..." value={data.monitoringProcess} onChange={(e) => setData({ ...data, monitoringProcess: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="audit">Audit-Rhythmus</Label>
                                <Input id="audit" placeholder="z.B. Jährliches internes Audit, externes Audit alle 2 Jahre" value={data.auditRhythm} onChange={(e) => setData({ ...data, auditRhythm: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="improvement">Verbesserungsprozess / Lessons Learned</Label>
                                <Textarea id="improvement" placeholder="z.B. Quartalsweise Retrospektiven, Dokumentation von Fehlern und deren Behebung im Wiki..." value={data.improvementProcess} onChange={(e) => setData({ ...data, improvementProcess: e.target.value })} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} disabled={step <= 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                </Button>
                <Button variant="secondary" onClick={() => handleSave()} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern...</> : 'Speichern & später fortfahren'}
                </Button>
                <div className="flex flex-col items-center">
                    {step < TOTAL_STEPS ? (
                        <Button onClick={nextStep} size="lg">Weiter <ChevronsRight className="ml-2 h-4 w-4" /></Button>
                    ) : (
                        <Button onClick={handleFinish} size="lg" disabled={!validateStep(step, data)}>Abschliessen & Speichern</Button>
                    )}
                    {validationError && (
                        <p className="text-sm text-red-600 mt-2">Bitte füllen Sie alle Pflichtfelder (*) aus, um fortzufahren.</p>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
