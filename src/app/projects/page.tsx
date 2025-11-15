
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
import { Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { createProject, getUserProjects, setActiveProjectId } from '@/lib/data-service';

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
            router.push('/assessment');
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        router.push(`/dashboard?projectId=${projectId}`);
    };
    
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
                    <h1 className="text-3xl font-bold mb-6">Meine Projekte</h1>

                    <Card className="mb-8 shadow-lg">
                        <CardHeader>
                            <CardTitle>Neues Projekt starten</CardTitle>
                            <CardDescription>
                                Beginnen Sie eine neue Compliance-Bewertung für ein Produkt oder System. Die Metadaten helfen bei der Erstellung des Audit-Dossiers.
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
                                        Projekt erstellen & Bewertung starten
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <h2 className="text-2xl font-bold mb-4 mt-12">Bestehende Projekte</h2>
                    {projects.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map(project => (
                                <Card key={project.id} className="flex flex-col justify-between hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="truncate">{project.projectName}</CardTitle>
                                        <CardDescription>
                                            Erstellt am: {project.metadata?.createdAt?.toDate().toLocaleDateString('de-DE') || 'N/A'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button onClick={() => handleSelectProject(project.id)} className="w-full">
                                            Zum Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        !isLoading && (
                            <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">Sie haben noch keine Projekte erstellt.</p>
                                <p className="text-muted-foreground">Starten Sie Ihr erstes Projekt oben.</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}

    