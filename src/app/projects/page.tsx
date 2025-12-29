
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, ArrowRight, CornerDownRight, FolderPlus } from 'lucide-react';
import { createProject, getUserProjects, setActiveProjectId } from '@/lib/data-service';
import { Separator } from '@/components/ui/separator';

interface Project {
    id: string;
    projectName: string;
    metadata: {
        createdAt?: { toDate: () => Date };
        [key: string]: any;
    };
}

const riskIndicators = [
    { id: 'fundamental_rights', label: 'Grundrechte von Personen' },
    { id: 'health_safety', label: 'Gesundheit und Sicherheit' },
    { id: 'access_to_services', label: 'Zugang zu wesentlichen Dienstleistungen' },
    { id: 'employment', label: 'Beschäftigung und Personalmanagement' },
    { id: 'law_enforcement', label: 'Strafverfolgung' },
];

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [sector, setSector] = useState('');
    const [systemType, setSystemType] = useState('');
    const [selectedRisks, setSelectedRisks] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const fetchProjects = async () => {
                setIsLoading(true);
                const userProjects = await getUserProjects();
                setProjects(userProjects as Project[]);
                setIsLoading(false);
            };
            fetchProjects();
        }
    }, [user, authLoading, router]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        setIsCreating(true);
        try {
            const metadata = {
                sector: sector,
                systemType: systemType,
                riskIndicators: selectedRisks,
            };
            const newProjectId = await createProject(newProjectName, metadata);
            setActiveProjectId(newProjectId);
            toast({
                title: "Projekt erstellt",
                description: `Das Projekt "${newProjectName}" wurde erfolgreich angelegt.`,
            });
            router.push(`/assessment?projectId=${newProjectId}`);
        } catch (error) {
            console.error("Failed to create project:", error);
            toast({
                title: "Fehler",
                description: "Das Projekt konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        router.push(`/dashboard?projectId=${projectId}`);
    };

    const handleJumpToLatest = () => {
        if (projects.length > 0) {
            handleSelectProject(projects[0].id);
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen w-full flex-col">
                <AppHeader />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Meine Projekte</h1>
                        {projects.length > 0 && (
                            <Button onClick={handleJumpToLatest} variant="secondary">
                                <CornerDownRight className="mr-2 h-4 w-4" /> Zum letzten Dashboard springen
                            </Button>
                        )}
                    </div>

                    {projects.length > 0 ? (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-4 tracking-tight text-slate-900 dark:text-slate-100">Bestehende Projekte</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map(project => (
                                    <Card key={project.id} className="flex flex-col justify-between hover:shadow-xl transition-shadow border-slate-200 dark:border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="truncate">{project.projectName}</CardTitle>
                                            <CardDescription>
                                                Erstellt am: {project.metadata?.createdAt?.toDate().toLocaleDateString('de-DE') || 'N/A'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardFooter>
                                            <Button onClick={() => handleSelectProject(project.id)} className="w-full text-primary" variant="outline">
                                                Zum Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 border-2 border-dashed rounded-xl bg-muted/30 mb-12">
                            <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Keine Projekte gefunden</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Sie haben noch keine Compliance-Projekte angelegt. Starten Sie jetzt mit Ihrer ersten KI-Bewertung.
                            </p>
                        </div>
                    )}

                    <Separator className="my-8" />


                    <Card className="shadow-lg mt-8 border-primary/20">
                        <CardHeader>
                            <CardTitle>Neues Projekt starten</CardTitle>
                            <CardDescription>
                                {projects.length > 0
                                    ? "Oder beginnen Sie eine neue Compliance-Bewertung für ein weiteres Produkt oder System."
                                    : "Erstellen Sie Ihr erstes Projekt, um den Status Ihrer KI-Systeme zu bewerten."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="project-name">Projekt- oder Produktname</Label>
                                <Input
                                    id="project-name"
                                    placeholder="z.B. 'Marketing-Chatbot v2' oder 'HR-Analyse-Tool'"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    disabled={isCreating}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="sector">Branche</Label>
                                    <Select value={sector} onValueChange={setSector} disabled={isCreating}>
                                        <SelectTrigger id="sector">
                                            <SelectValue placeholder="Branche auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="finance">Finanzwesen & Versicherungen</SelectItem>
                                            <SelectItem value="health">Gesundheitswesen</SelectItem>
                                            <SelectItem value="hr">Personalwesen (HR)</SelectItem>
                                            <SelectItem value="education">Bildung</SelectItem>
                                            <SelectItem value="public">Öffentlicher Sektor</SelectItem>
                                            <SelectItem value="ecommerce">E-Commerce & Handel</SelectItem>
                                            <SelectItem value="other">Andere</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="system-type">Systemtyp</Label>
                                    <Select value={systemType} onValueChange={setSystemType} disabled={isCreating}>
                                        <SelectTrigger id="system-type">
                                            <SelectValue placeholder="Art des KI-Systems..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="generative">Generative KI (z.B. Text, Bild)</SelectItem>
                                            <SelectItem value="classification">Klassifizierung & Scoring</SelectItem>
                                            <SelectItem value="biometric">Biometrische Identifikation</SelectItem>
                                            <SelectItem value="prediction">Vorhersagesystem</SelectItem>
                                            <SelectItem value="automation">Prozessautomatisierung</SelectItem>
                                            <SelectItem value="other">Andere</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label>Potenzielle Risikoindikatoren (gemäß Anhang III)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-md border bg-secondary/50">
                                    {riskIndicators.map((risk) => (
                                        <div key={risk.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={risk.id}
                                                checked={selectedRisks.includes(risk.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedRisks(prev => checked ? [...prev, risk.id] : prev.filter(r => r !== risk.id));
                                                }}
                                                disabled={isCreating}
                                            />
                                            <Label htmlFor={risk.id} className="text-sm font-normal cursor-pointer">{risk.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()} className="w-full sm:w-auto">
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Projekt wird erstellt...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        <span>Projekt erstellen & Bewertung starten</span>
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main >
        </div >
    );
}
