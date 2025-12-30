import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle } from 'lucide-react';
import { useProjectWizard } from '@/hooks/use-project-wizard';

export type WizardVariant = 'embedded' | 'card' | 'fullscreen';

interface ProjectCreationWizardProps {
    variant?: WizardVariant;
    onComplete: (projectId: string) => void;
}

const riskIndicators = [
    { id: 'fundamental_rights', label: 'Grundrechte von Personen' },
    { id: 'health_safety', label: 'Gesundheit und Sicherheit' },
    { id: 'access_to_services', label: 'Zugang zu wesentlichen Dienstleistungen' },
    { id: 'employment', label: 'Beschäftigung und Personalmanagement' },
    { id: 'law_enforcement', label: 'Strafverfolgung' },
];

export function ProjectCreationWizard({ variant = 'card', onComplete }: ProjectCreationWizardProps) {
    const { state, actions } = useProjectWizard();
    const { projectName, sector, systemType, selectedRisks, isSubmitting } = state;

    const handleSubmit = async () => {
        const projectId = await actions.submit();
        if (projectId) {
            onComplete(projectId);
        }
    };

    const isEmbedded = variant === 'embedded';

    // UI Wrappers based on variant
    const Container = isEmbedded ? 'div' : Card;
    const Header = isEmbedded ? 'div' : CardHeader;
    const Title = isEmbedded ? 'h3' : CardTitle;
    const Description = isEmbedded ? 'p' : CardDescription;
    const Content = isEmbedded ? 'div' : CardContent;
    const Footer = isEmbedded ? 'div' : CardFooter;

    const containerClasses = isEmbedded
        ? "w-full max-w-2xl mx-auto space-y-6"
        : "shadow-lg border-primary/20";

    return (
        <Container className={containerClasses}>
            <Header className={isEmbedded ? "mb-6 text-center" : ""}>
                <Title className={isEmbedded ? "text-2xl font-bold" : ""}>
                    {isEmbedded ? "Legen Sie Ihr erstes KI-Projekt an" : "Neues Projekt starten"}
                </Title>
                <Description className={isEmbedded ? "text-muted-foreground mt-2" : ""}>
                    {isEmbedded
                        ? "Es dauert nur wenige Minuten, um eine erste Risikoeinschätzung zu erhalten."
                        : "Erstellen Sie ein neues Projekt, um den Status Ihrer KI-Systeme zu bewerten."
                    }
                </Description>
            </Header>

            <Content className={isEmbedded ? "space-y-6" : "space-y-6"}>
                <div className="space-y-2">
                    <Label htmlFor="project-name">Projekt- oder Produktname</Label>
                    <Input
                        id="project-name"
                        placeholder="z.B. 'Marketing-Chatbot v2' oder 'HR-Analyse-Tool'"
                        value={projectName}
                        onChange={(e) => actions.setProjectName(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="sector">Branche</Label>
                        <Select value={sector} onValueChange={actions.setSector} disabled={isSubmitting}>
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
                        <Select value={systemType} onValueChange={actions.setSystemType} disabled={isSubmitting}>
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
                                    onCheckedChange={() => actions.toggleRisk(risk.id)}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor={risk.id} className="text-sm font-normal cursor-pointer">{risk.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </Content>

            <Footer className={isEmbedded ? "mt-8 flex justify-center" : ""}>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !projectName.trim()}
                    className={isEmbedded ? "w-full md:w-auto min-w-[200px]" : "w-full sm:w-auto"}
                    size={isEmbedded ? "lg" : "default"}
                >
                    {isSubmitting ? (
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
            </Footer>
        </Container>
    );
}
