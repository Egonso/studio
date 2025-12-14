
'use client';

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { getActiveProjectId, createPortfolioProject, getPortfolioProjects, updatePortfolioProjectAssessment, addPortfolioDecision, getPortfolioDecisions } from "@/lib/data-service";
import type { AIProject, AIProjectAssessment, AIProjectDecisionLog } from "@/lib/types-portfolio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, TrendingUp, AlertTriangle, Shield, Check, FileText, Activity } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<(AIProject & { assessment?: AIProjectAssessment })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newProject, setNewProject] = useState<Partial<AIProject>>({ status: 'idea' });
  const [newAssessment, setNewAssessment] = useState({ businessValue: 3, implementationEffort: 3, governanceRisk: 3 });

  // Detail View State
  const [selectedProject, setSelectedProject] = useState<(AIProject & { assessment?: AIProjectAssessment }) | null>(null);
  const [decisions, setDecisions] = useState<AIProjectDecisionLog[]>([]);
  const [newDecision, setNewDecision] = useState<Partial<AIProjectDecisionLog>>({ type: 'start' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (!loading && user && !getActiveProjectId()) {
        router.push('/projects');
        return;
    }
    if (user) {
        loadProjects();
    }
  }, [user, loading, router]);

  const loadProjects = async () => {
      setIsLoading(true);
      const data = await getPortfolioProjects();
      setProjects(data);
      setIsLoading(false);
  };

  const loadDecisions = async (projectId: string) => {
      const data = await getPortfolioDecisions(projectId);
      setDecisions(data);
  }

  const handleCreateProject = async () => {
      if (!newProject.title || !newProject.businessOwner) return;

      const id = await createPortfolioProject(newProject as any);
      await updatePortfolioProjectAssessment(id, newAssessment);

      setNewProject({ status: 'idea' });
      setNewAssessment({ businessValue: 3, implementationEffort: 3, governanceRisk: 3 });
      setWizardStep(1);
      setActiveTab('dashboard');
      loadProjects();
  };

  const handleAddDecision = async () => {
      if (!selectedProject || !newDecision.justification) return;

      await addPortfolioDecision(selectedProject.id, {
          ...newDecision,
          supervisor: user?.email || 'Unknown',
          approvedBy: user?.email || 'Unknown',
      } as any);

      setNewDecision({ type: 'continue', justification: '' });
      loadDecisions(selectedProject.id);
  }

  if (loading || !user) {
      return null;
  }

  const getMatrixPosition = (value: number, risk: number) => {
      // value 1-5 (y axis), risk 1-5 (x axis, inverted? usually low risk is better)
      // Standard BCG/Matrix: Y=Value, X=Risk (Low left, High right)
      // Let's normalize to percentage:
      const bottom = ((value - 1) / 4) * 100; // 0 to 100
      const left = ((risk - 1) / 4) * 100; // 0 to 100
      return { bottom: `${bottom}%`, left: `${left}%` };
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">KI-Portfolio Strategie</h1>
                    <p className="text-muted-foreground">Verwalten, bewerten und steuern Sie Ihre KI-Initiativen.</p>
                </div>
            </div>
            {activeTab === 'dashboard' && (
                <Button onClick={() => setActiveTab('wizard')}>
                    <Plus className="mr-2 h-4 w-4" /> Neues Projekt erfassen
                </Button>
            )}
        </div>

        <div className="max-w-6xl mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Portfolio Dashboard</TabsTrigger>
                    <TabsTrigger value="wizard">Erfassungs-Wizard</TabsTrigger>
                    <TabsTrigger value="details" disabled={!selectedProject}>Projektdetails & Entscheidungen</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gesamtprojekte</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{projects.length}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hoher Wert / Niedriges Risiko</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{projects.filter(p => (p.assessment?.businessValue || 0) >= 4 && (p.assessment?.governanceRisk || 0) <= 2).length}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hohes Risiko</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{projects.filter(p => (p.assessment?.governanceRisk || 0) >= 4).length}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Live / Rollout</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{projects.filter(p => ['live', 'rollout'].includes(p.status)).length}</div></CardContent></Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="h-[500px]">
                            <CardHeader><CardTitle>Portfolio Matrix (Value vs. Risk)</CardTitle><CardDescription>Y-Achse: Business Value, X-Achse: Governance Risiko</CardDescription></CardHeader>
                            <CardContent className="h-[400px] relative border rounded-md m-4 bg-slate-50 dark:bg-slate-900">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                    <div className="border-r border-b border-dashed border-gray-300 p-2 text-xs text-gray-400">Low Value / Low Risk</div>
                                    <div className="border-b border-dashed border-gray-300 p-2 text-xs text-gray-400 text-right">Low Value / High Risk</div>
                                    <div className="border-r border-dashed border-gray-300 p-2 text-xs text-gray-400 flex items-end">High Value / Low Risk</div>
                                    <div className="p-2 text-xs text-gray-400 flex items-end justify-end">High Value / High Risk</div>
                                </div>
                                {/* Labels */}
                                <div className="absolute -left-8 top-1/2 -rotate-90 text-sm font-bold text-muted-foreground">Business Value</div>
                                <div className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-sm font-bold text-muted-foreground">Governance Risiko</div>

                                {/* Plot Points */}
                                {projects.map((p) => {
                                    const pos = getMatrixPosition(p.assessment?.businessValue || 1, p.assessment?.governanceRisk || 1);
                                    return (
                                        <div
                                            key={p.id}
                                            className="absolute w-4 h-4 rounded-full bg-primary hover:scale-150 transition-transform cursor-pointer shadow-md"
                                            style={{ bottom: pos.bottom, left: pos.left, transform: 'translate(-50%, 50%)' }}
                                            title={`${p.title} (Val: ${p.assessment?.businessValue}, Risk: ${p.assessment?.governanceRisk})`}
                                            onClick={() => { setSelectedProject(p); loadDecisions(p.id); setActiveTab('details'); }}
                                        />
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Projektliste</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {projects.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => { setSelectedProject(project); loadDecisions(project.id); setActiveTab('details'); }}>
                                            <div>
                                                <h4 className="font-semibold">{project.title}</h4>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <Badge variant="outline">{project.status}</Badge>
                                                    <span>{project.department}</span>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <div className="font-medium">Score: {(project.assessment?.businessValue || 0) + (5 - (project.assessment?.governanceRisk || 0))}</div>
                                                <div className="text-xs text-muted-foreground">Risk: {project.assessment?.governanceRisk}/5</div>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.length === 0 && <p className="text-center text-muted-foreground py-8">Keine Projekte vorhanden.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="wizard">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Neues KI-Projekt erfassen</CardTitle>
                            <CardDescription>Schritt {wizardStep} von 2</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {wizardStep === 1 && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Projekttitel</Label>
                                        <Input value={newProject.title || ''} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="z.B. Kundenservice Bot" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Business Owner</Label>
                                            <Input value={newProject.businessOwner || ''} onChange={e => setNewProject({...newProject, businessOwner: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fachbereich</Label>
                                            <Input value={newProject.department || ''} onChange={e => setNewProject({...newProject, department: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={newProject.status} onValueChange={(v: any) => setNewProject({...newProject, status: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="idea">Idee</SelectItem>
                                                <SelectItem value="poc">PoC (Proof of Concept)</SelectItem>
                                                <SelectItem value="pilot">Pilot</SelectItem>
                                                <SelectItem value="rollout">Rollout</SelectItem>
                                                <SelectItem value="live">Live / Betrieb</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kurzbeschreibung</Label>
                                        <Textarea value={newProject.description || ''} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                                    </div>
                                </>
                            )}

                            {wizardStep === 2 && (
                                <>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><Label>Business Value (1-5)</Label><span className="font-bold">{newAssessment.businessValue}</span></div>
                                            <Slider min={1} max={5} step={1} value={[newAssessment.businessValue]} onValueChange={v => setNewAssessment({...newAssessment, businessValue: v[0]})} />
                                            <p className="text-xs text-muted-foreground">Wie hoch ist der erwartete wirtschaftliche oder strategische Nutzen?</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><Label>Implementierungsaufwand (1-5)</Label><span className="font-bold">{newAssessment.implementationEffort}</span></div>
                                            <Slider min={1} max={5} step={1} value={[newAssessment.implementationEffort]} onValueChange={v => setNewAssessment({...newAssessment, implementationEffort: v[0]})} />
                                            <p className="text-xs text-muted-foreground">Wie komplex und teuer ist die Umsetzung?</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><Label>Governance Risiko (1-5)</Label><span className="font-bold">{newAssessment.governanceRisk}</span></div>
                                            <Slider min={1} max={5} step={1} value={[newAssessment.governanceRisk]} onValueChange={v => setNewAssessment({...newAssessment, governanceRisk: v[0]})} />
                                            <p className="text-xs text-muted-foreground">Wie hoch sind Compliance-Risiken (AI Act, DSGVO) und Reputationsrisiken?</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            {wizardStep > 1 ? (
                                <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>Zurück</Button>
                            ) : (
                                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>Abbrechen</Button>
                            )}

                            {wizardStep < 2 ? (
                                <Button onClick={() => setWizardStep(wizardStep + 1)}>Weiter</Button>
                            ) : (
                                <Button onClick={handleCreateProject}>Projekt speichern</Button>
                            )}
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                     {selectedProject && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <div>
                                            <CardTitle>{selectedProject.title}</CardTitle>
                                            <CardDescription>{selectedProject.description}</CardDescription>
                                        </div>
                                        <Badge className="h-fit">{selectedProject.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-3 gap-4">
                                    <div><Label className="text-xs text-muted-foreground">Owner</Label><p>{selectedProject.businessOwner}</p></div>
                                    <div><Label className="text-xs text-muted-foreground">Department</Label><p>{selectedProject.department}</p></div>
                                    <div><Label className="text-xs text-muted-foreground">Risk Class</Label><p>{selectedProject.aiActRiskClass || 'Nicht klassifiziert'}</p></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Entscheidungslog (Audit Trail)</CardTitle><CardDescription>Dokumentation aller strategischen Entscheidungen.</CardDescription></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {decisions.map(decision => (
                                            <div key={decision.id} className="border-l-4 border-primary pl-4 py-2 bg-muted/20 rounded-r-md">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold uppercase text-sm tracking-wider">{decision.type}</span>
                                                    <span className="text-xs text-muted-foreground">{decision.date?.toDate ? decision.date.toDate().toLocaleDateString() : 'Gerade eben'}</span>
                                                </div>
                                                <p className="text-sm italic mb-2">"{decision.justification}"</p>
                                                <div className="text-xs text-muted-foreground flex gap-4">
                                                    <span>By: {decision.approvedBy}</span>
                                                    {decision.aiActReference && <span>Ref: {decision.aiActReference}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="font-medium mb-3 text-sm">Neue Entscheidung protokollieren</h4>
                                        <div className="grid gap-4">
                                            <Select value={newDecision.type} onValueChange={(v: any) => setNewDecision({...newDecision, type: v})}>
                                                <SelectTrigger><SelectValue placeholder="Entscheidungstyp" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="start">Start (Initiierung)</SelectItem>
                                                    <SelectItem value="continue">Fortführen (Review)</SelectItem>
                                                    <SelectItem value="stop">Stoppen</SelectItem>
                                                    <SelectItem value="build">Build (Eigenentwicklung)</SelectItem>
                                                    <SelectItem value="buy">Buy (Einkauf)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Textarea placeholder="Begründung (Audit-relevant)..." value={newDecision.justification || ''} onChange={e => setNewDecision({...newDecision, justification: e.target.value})} />
                                            <Button onClick={handleAddDecision} className="w-full"><Save className="mr-2 h-4 w-4" /> Entscheidung speichern</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                     )}
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
