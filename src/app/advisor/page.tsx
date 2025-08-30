
'use client';

import { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Lightbulb, TrendingUp, Upload, Info } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { aiImplementationAdvisor } from '@/ai/flows/ai-implementation-advisor';
import type { AiImplementationAdvisorInput, AiImplementationAdvisorOutput } from '@/ai/flows/ai-implementation-advisor';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const AiImplementationAdvisorInputSchema = z.object({
  companyDescription: z.string().min(10, { message: "Bitte beschreiben Sie Ihr Unternehmen etwas ausführlicher."}),
  challenge: z.string().min(10, { message: "Bitte beschreiben Sie Ihre Herausforderung etwas ausführlicher."}),
});

export default function AdvisorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [result, setResult] = useState<AiImplementationAdvisorOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const form = useForm<AiImplementationAdvisorInput>({
        resolver: zodResolver(AiImplementationAdvisorInputSchema),
        defaultValues: {
            companyDescription: '',
            challenge: '',
        },
    });

     const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();

            const setContent = (content: string) => {
                const currentDescription = form.getValues("companyDescription");
                const newDescription = currentDescription 
                    ? `${currentDescription}\n\n---\n[Inhalt von ${file.name}]:\n${content}`
                    : `[Inhalt von ${file.name}]:\n${content}`;
                form.setValue("companyDescription", newDescription, { shouldValidate: true });
            };

            if (file.type.startsWith('text/')) {
                reader.onload = (event) => {
                    const textContent = event.target?.result as string;
                    setContent(textContent);
                };
                reader.readAsText(file);
            } else {
                const placeholder = `Platzhalter für Datei: "${file.name}". Der Inhalt kann nicht direkt gelesen werden.`;
                setContent(placeholder);
            }
        }
    };


    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }
    
    const onSubmit = async (data: AiImplementationAdvisorInput) => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const advice = await aiImplementationAdvisor(data);
            setResult(advice);
        } catch (e) {
            console.error(e);
            setError("Die Beratung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Card className="w-full shadow-lg bg-secondary border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
                                        <Wand2 /> KI-Implementierungsberater
                                    </CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        Vom Problem zur Lösung: Beschreiben Sie Ihr Unternehmen und Ihre größte Herausforderung. Die KI analysiert Ihren Fall und schlägt Ihnen konkrete, auf KMUs zugeschnittene KI-Lösungsideen vor.
                                    </CardDescription>
                                </div>
                                <img src="https://i.postimg.cc/Dwym3LgN/EU-AI-Act-SIEGEL-2160-x-1080-px-Anhanger-25-x-25-Zoll2.webp" alt="AI Act Compass Siegel" className="h-24 w-24 hidden md:block" />
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <Card className="sticky top-8 shadow-lg">
                            <CardHeader>
                                <CardTitle>Ihr Kontext</CardTitle>
                                <CardDescription>Je genauer Ihre Angaben, desto besser die Vorschläge.</CardDescription>
                            </CardHeader>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="companyDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ihr Unternehmen</FormLabel>
                                                    <Alert variant="default" className="mt-2 text-xs">
                                                        <Info className="h-4 w-4" />
                                                        <AlertTitle>Hinweis zur Inhaltsanalyse</AlertTitle>
                                                        <AlertDescription>
                                                          Für eine Analyse des Inhalts von Dokumenten, laden Sie bitte eine Textdatei (.txt, .md) hoch oder kopieren Sie den Text manuell aus Ihrer PDF-/Word-Datei in dieses Feld.
                                                        </AlertDescription>
                                                    </Alert>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Beschreiben Sie kurz Ihre Branche, Ihre Produkte/Dienstleistungen und Ihre Kunden. Sie können hier Text eingeben oder eine Datei hochladen."
                                                            className="min-h-[120px] mt-2"
                                                            {...field}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                     <div className="pt-2">
                                                        <Input 
                                                            id="context-file-upload"
                                                            type="file"
                                                            className="hidden"
                                                            accept=".txt,.md,.text"
                                                            onChange={handleFileChange}
                                                            disabled={isLoading}
                                                        />
                                                        <label htmlFor="context-file-upload" className="w-full">
                                                            <Button type="button" asChild className="w-full cursor-pointer" variant="outline" disabled={isLoading}>
                                                            <span>
                                                                    <Upload className="mr-2 h-4 w-4" />
                                                                    Kontext-Dokument hochladen...
                                                            </span>
                                                            </Button>
                                                        </label>
                                                        {fileName && <p className="text-xs text-muted-foreground mt-2">Zuletzt hochgeladen: {fileName}</p>}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="challenge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ihre größte Herausforderung</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Wo sehen Sie das größte Potenzial oder den größten Schmerzpunkt? z.B. 'Hoher manueller Aufwand bei der Angebotserstellung' oder 'Wir möchten unsere Social-Media-Inhalte effizienter erstellen'."
                                                            className="min-h-[120px]"
                                                            {...field}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isValid}>
                                            {isLoading ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysiere...</>
                                            ) : "Lösungsvorschläge erhalten"}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>

                        <Card className="shadow-lg min-h-[400px]">
                            <CardHeader>
                                <CardTitle>KI-generierte Lösungsvorschläge</CardTitle>
                                <CardDescription>Hier erscheinen die Analyseergebnisse.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-2/3" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </div>
                                         <div className="space-y-2">
                                            <Skeleton className="h-5 w-1/2" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-4/6" />
                                        </div>
                                    </div>
                                )}
                                {error && <Alert variant="destructive"><AlertTitle>Fehler</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                                {result ? (
                                    <div className="space-y-6">
                                        {result.suggestions.map((suggestion, index) => (
                                            <div key={index}>
                                                <Card className="bg-background">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="text-primary"/> {suggestion.title}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                                                        <Separator />
                                                        <div className="flex items-start gap-3 text-sm">
                                                            <TrendingUp className="h-5 w-5 text-green-600 shrink-0"/>
                                                            <div>
                                                                <h4 className="font-semibold">Potenzieller Nutzen (ROI)</h4>
                                                                <p className="text-muted-foreground">{suggestion.potentialBenefit}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    !isLoading && <p className="text-center text-muted-foreground pt-12">Füllen Sie links Ihre Daten aus, um Vorschläge zu erhalten.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

    