'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, CornerDownRight } from 'lucide-react';
import { getUserProjects, setActiveProjectId } from '@/lib/data-service';
import { Separator } from '@/components/ui/separator';
import { ProjectCreationWizard } from '@/components/wizard/project-creation-wizard';

interface Project {
    id: string;
    projectName: string;
    metadata: {
        createdAt?: { toDate: () => Date };
        [key: string]: any;
    };
}

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const fetchProjects = async () => {
                setIsLoading(true);
                try {
                    const userProjects = await getUserProjects();

                    // Strict Onboarding Rule: No projects -> Go to Dashboard Wizard
                    if (userProjects.length === 0) {
                        router.replace('/dashboard');
                        return;
                    }

                    setProjects(userProjects as Project[]);
                } catch (error) {
                    console.error("Failed to load projects", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProjects();
        }
    }, [user, authLoading, router]);

    const handleSelectProject = (projectId: string) => {
        setActiveProjectId(projectId);
        router.push(`/dashboard?projectId=${projectId}`);
    };

    const handleJumpToLatest = () => {
        if (projects.length > 0) {
            handleSelectProject(projects[0].id);
        }
    }

    const handleProjectCreated = (projectId: string) => {
        // When created from the list view, we usually just go to the dashboard
        handleSelectProject(projectId);
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
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Meine Projekte</h1>
                        {projects.length > 0 && (
                            <Button onClick={handleJumpToLatest} variant="secondary">
                                <CornerDownRight className="mr-2 h-4 w-4" /> Zum letzten Dashboard springen
                            </Button>
                        )}
                    </div>

                    {/* Project List */}
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

                    <Separator className="my-8" />

                    {/* Reused Wizard Component */}
                    <ProjectCreationWizard
                        variant="card"
                        onComplete={handleProjectCreated}
                    />
                </div>
            </main >
        </div >
    );
}
