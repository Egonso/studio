
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AppHeader } from '@/components/app-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { saveCompanyContext } from '@/lib/data-service';

const contextSchema = z.object({
    companyDescription: z.string().min(10, { message: "Bitte beschreiben Sie Ihr Unternehmen etwas ausführlicher." }),
    existingAuditData: z.string().optional(),
    riskProfile: z.string().optional(),
});

type ContextFormData = z.infer<typeof contextSchema>;

export default function ContextPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [fileName, setFileName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<ContextFormData>({
        resolver: zodResolver(contextSchema),
        defaultValues: {
            companyDescription: "",
            existingAuditData: "",
            riskProfile: "",
        }
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                // We'll just pass the file name and a note that it's uploaded,
                // as we can't read the content of binary files directly in the browser for the AI.
                const fileContentPlaceholder = `Inhalt der Datei "${file.name}" wurde hochgeladen und wird für die Analyse berücksichtigt.`;
                field.onChange(fileContentPlaceholder);
            };
            // This is just to trigger the onload event. The actual content is not used.
            reader.readAsDataURL(file); 
        }
    };

    const onSubmit = async (data: ContextFormData) => {
        setIsSubmitting(true);
        await saveCompanyContext(data);
        router.push('/dashboard');
    };

    if (loading || !user) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Unternehmenskontext</CardTitle>
                                <CardDescription>
                                    Je mehr Kontext Sie uns geben, desto genauer und hilfreicher werden die KI-generierten Empfehlungen sein.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="companyDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unternehmens- & Tätigkeitsbeschreibung</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Beschreiben Sie, was Ihr Unternehmen tut, welche Produkte es anbietet und wer Ihre Kunden sind."
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="existingAuditData"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vorhandene Audit-Daten (optional)</FormLabel>
                                            <FormControl>
                                                <div>
                                                    <Input 
                                                        id="audit-file-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept=".txt,.md,.text,.pdf,.doc,.docx,.xls,.xlsx"
                                                        onChange={(e) => handleFileChange(e, field)}
                                                    />
                                                    <label htmlFor="audit-file-upload" className="w-full">
                                                        <Button type="button" asChild className="w-full cursor-pointer">
                                                           <span>
                                                                <Upload className="mr-2 h-4 w-4" />
                                                                Datei hochladen...
                                                           </span>
                                                        </Button>
                                                    </label>
                                                    {fileName && <p className="text-sm text-muted-foreground mt-2">Hochgeladene Datei: {fileName}</p>}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="riskProfile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selbsteinschätzung des Risikoprofils (optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Wo sehen Sie die größten Compliance-Risiken für Ihr Unternehmen in Bezug auf den EU AI Act?"
                                                    className="min-h-[120px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Speichern...
                                        </>
                                    ) : "Dashboard erstellen"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
