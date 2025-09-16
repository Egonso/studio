
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { courseData } from '@/lib/course-data';
import type { Video, Module } from '@/lib/course-data';
import { useAuth } from '@/context/auth-context';
import { getCourseProgress, saveCourseProgress } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { ExamCard } from '@/components/exam-card';

type Selection = {
    type: 'video';
    data: Video;
} | {
    type: 'exam';
    data: Module;
};

export default function CoursePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedItem, setSelectedItem] = useState<Selection | null>(null);
    const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            const loadProgress = async () => {
                const progress = await getCourseProgress();
                setCompletedVideos(new Set(progress));
                
                const videoId = searchParams.get('videoId');
                const moduleId = searchParams.get('moduleId');

                if (videoId) {
                    const video = courseData.flatMap(m => m.videos).find(v => v.id === videoId);
                    if (video) {
                        setSelectedItem({ type: 'video', data: video });
                    }
                } else if (moduleId) {
                    const module = courseData.find(m => m.id === moduleId && m.isExam);
                    if (module) {
                        setSelectedItem({ type: 'exam', data: module });
                    }
                } else if (courseData.length > 0 && courseData[0].videos.length > 0) {
                    // Default to first video
                    setSelectedItem({ type: 'video', data: courseData[0].videos[0] });
                }
                setIsLoading(false);
            };
            loadProgress();
        }
    }, [user, searchParams]);

    const handleSelectVideo = (video: Video) => {
        setSelectedItem({ type: 'video', data: video });
        router.push(`/kurs?videoId=${video.id}`, { scroll: false });
    };
    
    const handleSelectExam = (module: Module) => {
        setSelectedItem({ type: 'exam', data: module });
        router.push(`/kurs?moduleId=${module.id}`, { scroll: false });
    }

    const handleVideoEnd = () => {
        if (selectedItem?.type === 'video' && !completedVideos.has(selectedItem.data.id)) {
            const newCompleted = new Set(completedVideos);
            newCompleted.add(selectedItem.data.id);
            setCompletedVideos(newCompleted);
            saveCourseProgress(Array.from(newCompleted));
        }
    };
    
     const getDefaultOpenModule = () => {
        if (selectedItem?.type === 'video') {
            return `module-${selectedItem.data.id.split('-')[1]}`
        }
        if (selectedItem?.type === 'exam') {
            return selectedItem.data.id;
        }
        return 'module-0';
    }

    if (authLoading || isLoading || !user) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="flex-1 flex items-center justify-center">
                    <p>Lade Kursinhalte...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <div className="flex-1 grid md:grid-cols-[350px_1fr] gap-6 p-4 md:p-8">
                <aside className="flex flex-col gap-4">
                    <Card>
                        <CardContent className="p-2">
                             <ScrollArea className="h-[calc(100vh-10rem)]">
                                <Accordion type="multiple" defaultValue={[getDefaultOpenModule()]} className="w-full">
                                    {courseData.map(module => (
                                        <AccordionItem value={module.id} key={module.id}>
                                            <AccordionTrigger>{module.title}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col gap-1">
                                                    {module.isExam ? (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleSelectExam(module)}
                                                            className={cn(
                                                                "w-full justify-start text-left h-auto py-2",
                                                                selectedItem?.type === 'exam' && selectedItem.data.id === module.id && "bg-accent text-accent-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <GraduationCap className="h-4 w-4" />
                                                                <span className="flex-1">Prüfungsinformationen</span>
                                                            </div>
                                                        </Button>
                                                    ) : (
                                                        module.videos.map(video => (
                                                            <Button
                                                                key={video.id}
                                                                variant="ghost"
                                                                onClick={() => handleSelectVideo(video)}
                                                                className={cn(
                                                                    "w-full justify-start text-left h-auto py-2",
                                                                    selectedItem?.type === 'video' && selectedItem.data.id === video.id && "bg-accent text-accent-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {completedVideos.has(video.id) ? <CheckCircle className="h-4 w-4 text-primary" /> : <PlayCircle className="h-4 w-4" />}
                                                                    <span className="flex-1">{video.title}</span>
                                                                </div>
                                                            </Button>
                                                        ))
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </aside>
                <main>
                    <Card>
                        <CardContent className="p-4 md:p-6">
                            {selectedItem?.type === 'video' && (
                                <div className="space-y-4">
                                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                                        <video key={selectedItem.data.url} controls autoPlay className="w-full h-full" onEnded={handleVideoEnd}>
                                            <source src={selectedItem.data.url} type="video/mp4" />
                                            Ihr Browser unterstützt das Video-Tag nicht.
                                        </video>
                                    </div>
                                    <h1 className="text-2xl font-bold">{selectedItem.data.title}</h1>
                                    <p className="text-muted-foreground">{selectedItem.data.description}</p>
                                </div>
                            )}
                            {selectedItem?.type === 'exam' && <ExamCard />}
                            {!selectedItem && (
                                <div className="text-center p-8">
                                    <h1 className="text-2xl font-bold">Willkommen zur Kursplattform!</h1>
                                    <p className="text-muted-foreground mt-2">Wählen Sie links ein Video aus, um zu beginnen.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
