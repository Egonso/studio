'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  analyzeValueInfluenceAction,
  detectAntiPatternsAction,
  getDesignAdviceAction,
  getValueTensionAdviceAction,
} from '@/ai/actions';
import type {
  DetectAntiPatternsInput,
  DetectAntiPatternsOutput,
  GetDesignAdviceInput,
  GetDesignAdviceOutput,
  GetValueTensionAdviceOutput,
  ValueInfluenceAnalysisInput,
  ValueInfluenceAnalysisOutput,
} from '@/ai/shared-types';
import {
  principlesData,
  designPhases,
  Principle,
  DesignPhase,
} from '@/lib/design-thinking-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Loader2,
  Sparkles,
  Wand2,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Send,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Users,
  FileSignature,
  Layers,
  ChevronsRight,
  Milestone,
  GanttChartSquare,
  Zap,
  BadgeHelp,
  Handshake,
  BarChart,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  getDesignCanvasData,
  saveDesignCanvasData,
  getActiveProjectId,
  saveExportedInsight,
} from '@/lib/data-service';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface ValueMapping {
  [principleId: string]: {
    rating: number;
  };
}

interface Stakeholder {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'societal';
  concerns: string;
}

interface ValueTension {
  id: string;
  principleA: string;
  principleB: string;
  resolution: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  responsible: string;
  evidence: string;
  lifecyclePhase: string;
  sourcePrincipleId?: string;
}

interface DesignCanvasData {
  projectContext: string;
  stakeholders: Stakeholder[];
  advice: GetDesignAdviceOutput | null;
  antiPatternDescription: string;
  antiPatternAnalysis: DetectAntiPatternsOutput | null;
  valueMapping: ValueMapping;
  valueTensions: ValueTension[];
  requirements: Requirement[];
  valueInfluenceAnalysis: ValueInfluenceAnalysisOutput | null;
}

const ratingLabels = [
  'Irrelevant',
  'Niedrige Priorität',
  'Hohe Priorität',
  'Sehr hohe Priorität',
];
const stakeholderTypeLabels = {
  internal: 'Intern (Team, Management)',
  external: 'Extern (Kunden, Partner)',
  societal: 'Gesellschaftlich (Öffentlichkeit, Regulierer)',
};
const lifecyclePhases = ['Concept', 'Design', 'Build', 'Operate', 'Retire'];

function RequirementsTimeline({
  requirements,
}: {
  requirements: Requirement[];
}) {
  const groupedRequirements = lifecyclePhases.reduce(
    (acc, phase) => {
      acc[phase] = requirements.filter((req) => req.lifecyclePhase === phase);
      return acc;
    },
    {} as Record<string, Requirement[]>,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        {lifecyclePhases.map((phase) => (
          <div key={phase} className="space-y-3">
            <h3 className="font-semibold text-center text-sm sticky top-0 bg-background py-2">
              {phase}
            </h3>
            <div className="space-y-3 p-2 rounded-lg bg-secondary/50 min-h-[100px]">
              {groupedRequirements[phase].length > 0 ? (
                groupedRequirements[phase].map((req) => (
                  <Card key={req.id} className="text-xs">
                    <CardContent className="p-2">
                      <p className="font-semibold">{req.title}</p>
                      <p className="text-muted-foreground truncate">
                        Verantwortlich: {req.responsible || 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-xs text-muted-foreground pt-4">
                  Keine Einträge
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementManager({
  requirements,
  setCanvasData,
}: {
  requirements: Requirement[];
  setCanvasData: React.Dispatch<React.SetStateAction<DesignCanvasData>>;
}) {
  const addRequirement = () => {
    setCanvasData((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          id: new Date().getTime().toString(),
          title: '',
          description: '',
          responsible: '',
          evidence: '',
          lifecyclePhase: '',
        },
      ],
    }));
  };

  const removeRequirement = (id: string) => {
    setCanvasData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((req) => req.id !== id),
    }));
  };

  const handleReqChange = (
    id: string,
    field: keyof Omit<Requirement, 'id'>,
    value: string,
  ) => {
    setCanvasData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req) =>
        req.id === id ? { ...req, [field]: value } : req,
      ),
    }));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSignature className="text-primary" />
            Value-to-Requirement-Traceability
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={requirements.length === 0}
              >
                <GanttChartSquare className="mr-2 h-4 w-4" /> Timeline anzeigen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Anforderungs-Timeline</DialogTitle>
                <DialogDescription>
                  Eine visuelle Übersicht Ihrer Anforderungen, geordnet nach der
                  Lifecycle-Phase.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto p-1">
                <RequirementsTimeline requirements={requirements} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Hier werden aus Werten konkrete, nachverfolgbare Anforderungen, die
          durch Nachweise auditiert werden können.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requirements.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-4">
            Keine Anforderungen definiert. Generieren Sie Anforderungen aus hoch
            priorisierten Werten im "Werte-Mapping" oder fügen Sie sie manuell
            hinzu.
          </p>
        )}
        {requirements.map((req) => (
          <div
            key={req.id}
            className="p-4 rounded-lg border bg-secondary/50 space-y-3"
          >
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">Anforderung</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRequirement(req.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input
              placeholder="Titel der Anforderung (z.B. 'Transparenz bei Chatbot-Antworten')"
              value={req.title}
              onChange={(e) => handleReqChange(req.id, 'title', e.target.value)}
            />
            <Textarea
              placeholder="Beschreibung und Akzeptanzkriterien"
              value={req.description}
              onChange={(e) =>
                handleReqChange(req.id, 'description', e.target.value)
              }
              className="text-xs min-h-[80px]"
            />
            <Input
              placeholder="Verantwortliche Person (RACI)"
              value={req.responsible}
              onChange={(e) =>
                handleReqChange(req.id, 'responsible', e.target.value)
              }
            />
            <div className="bg-background/50 -mx-4 -mb-4 p-4 rounded-b-lg mt-3 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Milestone className="h-4 w-4 text-primary" /> Lifecycle-Phase
                </Label>
                <Select
                  value={req.lifecyclePhase}
                  onValueChange={(value) =>
                    handleReqChange(req.id, 'lifecyclePhase', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Phase zuordnen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lifecyclePhases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-primary" /> Verification Layer
                  / Evidence
                </Label>
                <Textarea
                  placeholder="Nachweis oder Test (z.B. Link zum Bias-Test Protokoll, Screenshot des UI-Elements)"
                  value={req.evidence}
                  onChange={(e) =>
                    handleReqChange(req.id, 'evidence', e.target.value)
                  }
                  className="text-xs mt-2"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addRequirement}
          className="w-full"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Manuelle Anforderung
          hinzufügen
        </Button>
      </CardContent>
    </Card>
  );
}

function TensionAnalysisDialog({
  tension,
  setCanvasData,
  projectContext,
}: {
  tension: ValueTension;
  setCanvasData: React.Dispatch<React.SetStateAction<DesignCanvasData>>;
  projectContext: string;
}) {
  const [open, setOpen] = useState(false);
  const [synergyInsights, setSynergyInsights] =
    useState<GetValueTensionAdviceOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const principleA = principlesData.find((p) => p.id === tension.principleA);
  const principleB = principlesData.find((p) => p.id === tension.principleB);

  const handleGenerateInsights = async () => {
    if (!principleA || !principleB) return;
    setIsGenerating(true);
    setSynergyInsights(null);
    try {
      const result = await getValueTensionAdviceAction({
        projectContext: projectContext || 'Ein allgemeines Software-Produkt.',
        principleA,
        principleB,
      });
      setSynergyInsights(result);
    } catch (e) {
      console.error('Failed to get synergy insights:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResolutionChange = (value: string) => {
    setCanvasData((prev) => ({
      ...prev,
      valueTensions: prev.valueTensions.map((t) =>
        t.id === tension.id ? { ...t, resolution: value } : t,
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-full w-full bg-secondary/30 hover:bg-secondary transition-colors" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="text-primary" />
            Konfliktanalyse: {principleA?.title} vs. {principleB?.title}
          </DialogTitle>
          <DialogDescription>
            Dokumentieren Sie hier, wie Sie den Wertekonflikt auflösen und als
            Chance nutzen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="resolution">Ihre Entscheidung & Auflösung</Label>
            <Textarea
              id="resolution"
              placeholder="z.B. 'Wir priorisieren Transparenz, indem wir die Funktionsweise des Algorithmus offenlegen, anonymisieren aber alle Trainingsdaten, um die Privatsphäre zu schützen.'"
              className="min-h-[100px] mt-1"
              value={tension.resolution}
              onChange={(e) => handleResolutionChange(e.target.value)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Synergie-Impulse
                  erhalten
                </>
              )}
            </Button>
            {synergyInsights && (
              <div className="space-y-4 pt-4 animate-in fade-in-50">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />{' '}
                    Synergie-Vorschlag
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-secondary rounded-md">
                    {synergyInsights.synergyProposal}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BadgeHelp className="h-4 w-4 text-yellow-500" />{' '}
                    Impulsfragen
                  </h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-muted-foreground">
                    {synergyInsights.impulseQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ValueTensionMatrix({
  tensions,
  setCanvasData,
  projectContext,
}: {
  tensions: ValueTension[];
  setCanvasData: React.Dispatch<React.SetStateAction<DesignCanvasData>>;
  projectContext: string;
}) {
  const handleAddTension = (principleAId: string, principleBId: string) => {
    // Prevent adding if it already exists
    if (
      tensions.some(
        (t) =>
          (t.principleA === principleAId && t.principleB === principleBId) ||
          (t.principleA === principleBId && t.principleB === principleAId),
      )
    ) {
      return;
    }
    setCanvasData((prev) => ({
      ...prev,
      valueTensions: [
        ...prev.valueTensions,
        {
          id: `${principleAId}-${principleBId}`,
          principleA: principleAId,
          principleB: principleBId,
          resolution: '',
        },
      ],
    }));
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border p-1 w-24 h-24"></th>
              {principlesData.map((p) => (
                <th
                  key={p.id}
                  className="border p-1 w-24 h-24 align-bottom text-center transform -rotate-45"
                >
                  <span className="inline-block whitespace-nowrap">
                    {p.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {principlesData.map((rowPrinciple, rowIndex) => (
              <tr key={rowPrinciple.id}>
                <th className="border p-1 w-24 h-24 text-left align-top">
                  {rowPrinciple.title}
                </th>
                {principlesData.map((colPrinciple, colIndex) => {
                  if (colIndex < rowIndex) {
                    const tension = tensions.find(
                      (t) =>
                        (t.principleA === rowPrinciple.id &&
                          t.principleB === colPrinciple.id) ||
                        (t.principleA === colPrinciple.id &&
                          t.principleB === rowPrinciple.id),
                    );
                    return (
                      <td
                        key={colPrinciple.id}
                        className="border p-0 w-24 h-24 text-center relative"
                      >
                        {tension ? (
                          <TensionAnalysisDialog
                            tension={tension}
                            setCanvasData={setCanvasData}
                            projectContext={projectContext}
                          />
                        ) : (
                          <button
                            onClick={() =>
                              handleAddTension(rowPrinciple.id, colPrinciple.id)
                            }
                            className="h-full w-full hover:bg-secondary/50"
                            title={`Konflikt zwischen '${rowPrinciple.title}' und '${colPrinciple.title}' analysieren`}
                          />
                        )}
                        {tension?.resolution && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Handshake className="h-6 w-6 text-primary opacity-50" />
                          </div>
                        )}
                      </td>
                    );
                  } else if (colIndex === rowIndex) {
                    return (
                      <td
                        key={colPrinciple.id}
                        className="border bg-muted w-24 h-24"
                      ></td>
                    );
                  }
                  return (
                    <td key={colPrinciple.id} className="p-0 w-24 h-24"></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground text-center pt-2">
        Klicken Sie auf ein leeres Feld, um einen Wertekonflikt zu analysieren.
      </p>
    </div>
  );
}

export function DesignCanvas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<DesignPhase>(
    designPhases[0],
  );
  const [selectedPrinciple, setSelectedPrinciple] = useState<Principle>(
    principlesData[0],
  );

  const [canvasData, setCanvasData] = useState<DesignCanvasData>({
    projectContext: '',
    stakeholders: [{ id: '1', name: '', type: 'external', concerns: '' }],
    advice: null,
    antiPatternDescription: '',
    antiPatternAnalysis: null,
    valueMapping: {},
    valueTensions: [],
    requirements: [],
    valueInfluenceAnalysis: null,
  });

  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAnalyzingValues, setIsAnalyzingValues] = useState(false);

  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [valueAnalysisError, setValueAnalysisError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const loadData = async () => {
      if (user && getActiveProjectId()) {
        setIsInitializing(true);
        const data = (await getDesignCanvasData()) as DesignCanvasData | null;
        if (data) {
          const stakeholders =
            Array.isArray(data.stakeholders) && data.stakeholders.length > 0
              ? data.stakeholders
              : [
                  {
                    id: '1',
                    name: '',
                    type: 'external',
                    concerns: '',
                  } as Stakeholder,
                ];
          const valueTensions = Array.isArray(data.valueTensions)
            ? data.valueTensions
            : [];
          const requirements = Array.isArray(data.requirements)
            ? data.requirements
            : [];
          const valueInfluenceAnalysis = data.valueInfluenceAnalysis || null;
          setCanvasData((prev) => ({
            ...prev,
            ...data,
            stakeholders,
            valueTensions,
            requirements,
            valueInfluenceAnalysis,
          }));
        }
        setIsInitializing(false);
      }
    };
    loadData();
  }, [user]);

  const handleGenerateAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAdviceError(null);
    setCanvasData((prev) => ({ ...prev, advice: null }));

    try {
      const input: GetDesignAdviceInput = {
        phase: selectedPhase,
        principle: selectedPrinciple,
        projectContext:
          canvasData.projectContext ||
          'Ein allgemeines Software-Produkt für den europäischen Markt.',
      };
      const result = await getDesignAdviceAction(input);
      setCanvasData((prev) => ({ ...prev, advice: result }));
    } catch (e) {
      console.error('Failed to get design advice:', e);
      setAdviceError(
        'Die KI-gestützte Beratung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.',
      );
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleDetectAntiPatterns = async () => {
    if (!canvasData.antiPatternDescription) return;
    setIsDetecting(true);
    setDetectorError(null);
    setCanvasData((prev) => ({ ...prev, antiPatternAnalysis: null }));

    try {
      const input: DetectAntiPatternsInput = {
        description: canvasData.antiPatternDescription,
      };
      const result = await detectAntiPatternsAction(input);
      setCanvasData((prev) => ({ ...prev, antiPatternAnalysis: result }));
    } catch (e) {
      console.error('Failed to detect anti-patterns:', e);
      setDetectorError(
        'Die Mustererkennung konnte nicht durchgeführt werden. Bitte versuchen Sie es später erneut.',
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAnalyzeValues = async () => {
    setIsAnalyzingValues(true);
    setValueAnalysisError(null);
    try {
      const input: ValueInfluenceAnalysisInput = {
        projectContext:
          canvasData.projectContext || 'Ein allgemeines Software-Produkt.',
        stakeholders: canvasData.stakeholders.filter(
          (s) => s.name && s.concerns,
        ),
      };
      if (input.stakeholders.length === 0) {
        setValueAnalysisError(
          'Bitte definieren Sie mindestens einen Stakeholder mit Namen und Anliegen.',
        );
        setIsAnalyzingValues(false);
        return;
      }
      const result = await analyzeValueInfluenceAction(input);
      setCanvasData((prev) => ({ ...prev, valueInfluenceAnalysis: result }));
    } catch (e) {
      console.error('Failed to analyze value influence:', e);
      setValueAnalysisError('Die Analyse konnte nicht durchgeführt werden.');
    } finally {
      setIsAnalyzingValues(false);
    }
  };

  const handleExportInsight = async (insightText: string) => {
    try {
      await saveExportedInsight(insightText);
      toast({
        title: 'Erfolg!',
        description: 'Der Eintrag wurde zum Audit-Dossier hinzugefügt.',
      });
    } catch (error) {
      console.error('Failed to export insight:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Eintrag konnte nicht gespeichert werden.',
      });
    }
  };

  const handleValueMappingChange = (
    principleId: string,
    key: 'rating',
    value: number,
  ) => {
    setCanvasData((prev) => {
      const newMapping = { ...prev.valueMapping };
      if (!newMapping[principleId]) {
        newMapping[principleId] = { rating: 0 };
      }
      (newMapping[principleId] as any)[key] = value;
      return { ...prev, valueMapping: newMapping };
    });
  };

  const handleStakeholderChange = (
    index: number,
    field: keyof Omit<Stakeholder, 'id'>,
    value: string,
  ) => {
    const newStakeholders = [...canvasData.stakeholders];
    (newStakeholders[index] as any)[field] = value;
    setCanvasData((prev) => ({ ...prev, stakeholders: newStakeholders }));
  };

  const addStakeholder = () => {
    setCanvasData((prev) => ({
      ...prev,
      stakeholders: [
        ...prev.stakeholders,
        {
          id: new Date().getTime().toString(),
          name: '',
          type: 'external',
          concerns: '',
        },
      ],
    }));
  };

  const removeStakeholder = (index: number) => {
    if (canvasData.stakeholders.length > 1) {
      const newStakeholders = canvasData.stakeholders.filter(
        (_, i) => i !== index,
      );
      setCanvasData((prev) => ({ ...prev, stakeholders: newStakeholders }));
    } else {
      setCanvasData((prev) => ({
        ...prev,
        stakeholders: [{ id: '1', name: '', type: 'external', concerns: '' }],
      }));
    }
  };

  // --- Requirement Generation ---
  const generateRequirementFromPrinciple = (principle: Principle) => {
    const newRequirement: Requirement = {
      id: new Date().getTime().toString(),
      title: `Anforderung für: ${principle.title}`,
      description: `Definieren Sie die technischen und organisatorischen Maßnahmen, um das Prinzip "${principle.title}" im Organisationkontext sicherzustellen.\n\nAkzeptanzkriterien:\n- \n- `,
      responsible: '',
      evidence: '',
      lifecyclePhase: '',
      sourcePrincipleId: principle.id,
    };
    setCanvasData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, newRequirement],
    }));
  };

  // Save canvas data on change, with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!isInitializing && getActiveProjectId()) {
        saveDesignCanvasData(canvasData);
      }
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [canvasData, isInitializing]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="space-y-8 sticky top-8 lg:col-span-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary" /> 1. Stakeholder & Kontext
            </CardTitle>
            <CardDescription>
              Definieren Sie, wer von Ihrer KI betroffen ist und was Sie
              vorhaben.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInitializing ? (
              <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project-context">
                    Ihre Idee / Ihr Organisationkontext
                  </Label>
                  <Textarea
                    id="project-context"
                    placeholder="z.B. 'Ein KI-Chatbot für den Kundenservice' oder 'Ein Tool zur Analyse von Bewerbungsunterlagen'."
                    value={canvasData.projectContext}
                    onChange={(e) =>
                      setCanvasData((prev) => ({
                        ...prev,
                        projectContext: e.target.value,
                      }))
                    }
                    className="min-h-[100px] mt-1"
                  />
                </div>
                <div className="space-y-4">
                  <Label>Betroffene Stakeholder</Label>
                  {canvasData.stakeholders.map((stakeholder, index) => (
                    <div
                      key={stakeholder.id}
                      className="p-4 rounded-lg border bg-secondary/50 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Name (z.B. Endkunden)"
                          value={stakeholder.name}
                          onChange={(e) =>
                            handleStakeholderChange(
                              index,
                              'name',
                              e.target.value,
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStakeholder(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Select
                        value={stakeholder.type}
                        onValueChange={(value) =>
                          handleStakeholderChange(index, 'type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(stakeholderTypeLabels).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Betroffenheit / Interessen (z.B. 'Erhalten KI-generierte Antworten auf Anfragen')"
                        value={stakeholder.concerns}
                        onChange={(e) =>
                          handleStakeholderChange(
                            index,
                            'concerns',
                            e.target.value,
                          )
                        }
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addStakeholder}
                    className="w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Stakeholder
                    hinzufügen
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                  <BarChart className="mr-2 h-4 w-4" />
                  Stakeholder-Werte analysieren
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Analyse der Stakeholder-Werte (Value Influence Table)
                  </DialogTitle>
                  <DialogDescription>
                    Führen Sie eine KI-gestützte Analyse durch, um die
                    Interessen Ihrer Stakeholder den ethischen Werten
                    zuzuordnen.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={handleAnalyzeValues}
                      disabled={isAnalyzingValues}
                    >
                      {isAnalyzingValues ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analysiere...
                        </>
                      ) : (
                        'Analyse jetzt durchführen'
                      )}
                    </Button>
                  </div>
                  {valueAnalysisError && (
                    <Alert variant="destructive">
                      <AlertDescription>{valueAnalysisError}</AlertDescription>
                    </Alert>
                  )}

                  {canvasData.valueInfluenceAnalysis?.results ? (
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-secondary">
                            <th className="p-2 border text-left">Prinzip</th>
                            {canvasData.valueInfluenceAnalysis.results.map(
                              (r) => (
                                <th
                                  key={r.stakeholderId}
                                  className="p-2 border"
                                >
                                  {r.stakeholderName}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {principlesData.map((principle) => (
                            <tr key={principle.id}>
                              <td className="p-2 border font-semibold">
                                {principle.title}
                              </td>
                              {canvasData.valueInfluenceAnalysis!.results.map(
                                (stakeholderResult) => {
                                  const analysis =
                                    stakeholderResult.analysis.find(
                                      (a) => a.principleId === principle.id,
                                    );
                                  return (
                                    <td
                                      key={stakeholderResult.stakeholderId}
                                      className="p-2 border text-center"
                                      title={analysis?.rationale}
                                    >
                                      {analysis?.priority || 'N/A'}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !isAnalyzingValues && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Hier erscheinen die Analyseergebnisse.
                      </p>
                    )
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" /> 2. Impulse & Analyse
            </CardTitle>
            <CardDescription>
              Wählen Sie Phase & Prinzip und lassen Sie die KI mitdenken.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInitializing ? (
              <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phase-select">Design-Phase</Label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedPhase(
                        designPhases.find((p) => p.id === value) ||
                          designPhases[0],
                      )
                    }
                    defaultValue={selectedPhase.id}
                  >
                    <SelectTrigger id="phase-select">
                      <SelectValue placeholder="Phase auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {designPhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principle-select">
                    Prinzip der vertrauensw. Intelligenz
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedPrinciple(
                        principlesData.find((p) => p.id === value) ||
                          principlesData[0],
                      )
                    }
                    defaultValue={selectedPrinciple.id}
                  >
                    <SelectTrigger id="principle-select">
                      <SelectValue placeholder="Prinzip auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {principlesData.map((principle) => (
                        <SelectItem key={principle.id} value={principle.id}>
                          {principle.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateAdvice}
                  disabled={isGeneratingAdvice || isInitializing}
                  className="w-full"
                >
                  {isGeneratingAdvice ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Generiere
                      Impulse...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" /> Entwicklungsimpulse
                      generieren
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="text-primary" /> 3. Werte-Mapping
            </CardTitle>
            <CardDescription>
              Definieren Sie die Priorität der ethischen Werte für Ihr
              Organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInitializing ? (
              <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
            ) : (
              <div className="space-y-6">
                {principlesData.map((p) => {
                  const mapping = canvasData.valueMapping?.[p.id] || {
                    rating: 0,
                  };
                  const isHighPrio = mapping.rating >= 2;
                  return (
                    <div key={p.id} className="space-y-3">
                      <Label
                        htmlFor={`slider-${p.id}`}
                        className="font-semibold"
                      >
                        {p.title}
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id={`slider-${p.id}`}
                          min={0}
                          max={3}
                          step={1}
                          value={[mapping.rating]}
                          onValueChange={(value) =>
                            handleValueMappingChange(p.id, 'rating', value[0])
                          }
                          className="flex-1"
                        />
                        <span className="text-xs font-medium w-32 text-right">
                          {ratingLabels[mapping.rating]}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isHighPrio}
                        onClick={() => generateRequirementFromPrinciple(p)}
                        className="w-full text-xs"
                      >
                        <ChevronsRight className="mr-2 h-4 w-4" /> Anforderung
                        generieren
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-primary" /> 4. Wertekonflikte
              analysieren
            </CardTitle>
            <CardDescription>
              Visualisieren und lösen Sie Spannungsfelder zwischen ethischen
              Werten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInitializing ? (
              <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Handshake className="mr-2 h-4 w-4" /> Konflikt-Matrix
                    öffnen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl">
                  <DialogHeader>
                    <DialogTitle>Value Tension Matrix</DialogTitle>
                    <DialogDescription>
                      Klicken Sie auf ein Feld in der Matrix, um einen
                      potenziellen Konflikt zwischen zwei Werten zu analysieren
                      und eine Lösung zu dokumentieren.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 max-h-[75vh] overflow-auto">
                    <ValueTensionMatrix
                      tensions={canvasData.valueTensions}
                      setCanvasData={setCanvasData}
                      projectContext={canvasData.projectContext}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive" /> 5. Anti-Pattern
              Detektor
            </CardTitle>
            <CardDescription>
              Prüfen Sie User-Workflows auf manipulative Designs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInitializing ? (
              <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
            ) : (
              <>
                <Textarea
                  placeholder="Beispiel: Der User legt ein Produkt in den Warenkorb. Beim Checkout fügen wir automatisch eine teure Express-Lieferung hinzu, die der User aktiv abwählen muss."
                  className="min-h-[100px]"
                  value={canvasData.antiPatternDescription}
                  onChange={(e) =>
                    setCanvasData((prev) => ({
                      ...prev,
                      antiPatternDescription: e.target.value,
                    }))
                  }
                  disabled={isDetecting}
                />
                <Button
                  onClick={handleDetectAntiPatterns}
                  disabled={
                    isDetecting || !canvasData.antiPatternDescription.trim()
                  }
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Prüfe Muster...
                    </>
                  ) : (
                    <>Muster prüfen</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: AI-Generated Output & Requirements */}
      <div className="space-y-8 lg:col-span-2">
        <Card className="shadow-lg min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="text-primary" />
              Ihre generierten Impulse & Analysen
            </CardTitle>
            <CardDescription>
              Hier erscheinen Ihre Ergebnisse. Fügen Sie wichtige Erkenntnisse
              mit einem Klick zum Audit-Dossier hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInitializing ? (
              <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                {/* Inspiration Layer Output */}
                {isGeneratingAdvice ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : adviceError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Fehler</AlertTitle>
                    <AlertDescription>{adviceError}</AlertDescription>
                  </Alert>
                ) : canvasData.advice ? (
                  <Accordion
                    type="multiple"
                    defaultValue={['item-0']}
                    className="w-full animate-in fade-in-50"
                  >
                    {canvasData.advice.sections.map((section, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-md font-semibold">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            {section.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleExportInsight(
                                `**${section.title}**:\n${section.content.map((c) => `- ${c}`).join('\n')}`,
                              )
                            }
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Abschnitt zum Audit-Dossier
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-center text-muted-foreground pt-12">
                    Definieren Sie links Ihren Kontext und klicken Sie auf
                    "Entwicklungsimpulse generieren", um hier Vorschläge zu
                    erhalten.
                  </p>
                )}

                <Separator className="my-8" />

                {/* Anti-Pattern Detector Output */}
                {isDetecting ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : detectorError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Fehler</AlertTitle>
                    <AlertDescription>{detectorError}</AlertDescription>
                  </Alert>
                ) : canvasData.antiPatternAnalysis ? (
                  <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg mb-2">
                      Analyse der Anti-Pattern
                    </h3>
                    {canvasData.antiPatternAnalysis.detectedPatterns.length >
                    0 ? (
                      canvasData.antiPatternAnalysis.detectedPatterns.map(
                        (pattern, index) => (
                          <div key={index}>
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>
                                Potenzielles Problem gefunden:{' '}
                                {pattern.patternName}
                              </AlertTitle>
                              <AlertDescription className="space-y-2 mt-2">
                                <p>
                                  <strong>Erklärung:</strong>{' '}
                                  {pattern.explanation}
                                </p>
                                <p>
                                  <strong>Besserer Vorschlag:</strong>{' '}
                                  {pattern.suggestion}
                                </p>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    handleExportInsight(
                                      `**Anti-Pattern-Analyse: ${pattern.patternName}**\n**Problem:** ${pattern.explanation}\n**Lösungsvorschlag:** ${pattern.suggestion}`,
                                    )
                                  }
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Analyse zum Audit-Dossier
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </div>
                        ),
                      )
                    ) : (
                      <Alert
                        variant="default"
                        className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>
                          Keine offensichtlichen Anti-Pattern gefunden
                        </AlertTitle>
                        <AlertDescription>
                          In der beschriebenen Vorgehensweise wurden keine
                          gängigen manipulativen Muster erkannt.
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              handleExportInsight(
                                `**Anti-Pattern-Analyse:**\nKeine offensichtlichen Anti-Pattern im beschriebenen Workflow gefunden.`,
                              )
                            }
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Ergebnis zum Audit-Dossier
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Beschreiben Sie links einen Workflow, um ihn auf
                    Anti-Pattern zu prüfen.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {isInitializing ? (
          <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />
        ) : (
          <RequirementManager
            requirements={canvasData.requirements}
            setCanvasData={setCanvasData}
          />
        )}
      </div>
    </div>
  );
}
