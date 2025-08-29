
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AppHeader } from '@/components/app-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const contextSchema = z.object({
    companyDescription: z.string().min(10, { message: "Bitte beschreiben Sie Ihr Unternehmen etwas ausführlicher." }),
    existingAuditData: z.string().optional(),
    riskProfile: z.string().optional(),
});

type ContextFormData = z.infer<typeof contextSchema>;

export default function ContextPage() {
    const router = useRouter();
    const form = useForm<ContextFormData>({
        resolver: zodResolver(contextSchema),
        defaultValues: {
            companyDescription: "",
            existingAuditData: "",
            riskProfile: "",
        }
    });

    const onSubmit = (data: ContextFormData) => {
        localStorage.setItem('companyContext', JSON.stringify(data));
        router.push('/dashboard');
    };

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
                                                <Textarea
                                                    placeholder="Fügen Sie hier Informationen aus bestehenden Audits, Zertifizierungen (z.B. ISO 27001) oder Compliance-Prüfungen ein."
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
                                <Button type="submit" className="w-full">
                                    Dashboard erstellen
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
