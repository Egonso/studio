
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, AlertTriangle, CheckCircle } from "lucide-react";

export function ExamCard() {
    const handleStartExam = () => {
        window.open('https://eukigesetz.com/exam', '_blank', 'noopener,noreferrer');
    };
    
    return (
        <Card className="w-full shadow-lg border-0">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <GraduationCap className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">Finale Zertifizierungsprüfung zum EU-KI-Akt Beauftragten</CardTitle>
                        <CardDescription>Der letzte Schritt zu Ihrem offiziellen Zertifikat.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-center text-lg font-medium">
                    Herzlichen Glückwunsch! Sie haben alle Module erfolgreich abgeschlossen und sind nun bereit für die finale Zertifizierungsprüfung.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-secondary rounded-lg">
                        <h3 className="font-semibold text-lg">Prüfungsablauf</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Öffnen Sie die Prüfungsseite.</li>
                            <li>Geben Sie den geheimen Passcode ein: <code className="bg-muted text-foreground font-mono p-1 rounded-sm">#061224!</code> (Bitte inkl. Ausrufezeichen)</li>
                            <li>Beantworten Sie die Multiple-Choice-Fragen.</li>
                        </ol>
                        <ul className="list-disc list-inside pl-4 text-xs text-muted-foreground">
                            <li>2 Minuten Zeit pro Frage</li>
                            <li>Mind. 80% richtige Antworten zum Bestehen</li>
                            <li>Direktes Feedback nach jeder Antwort</li>
                        </ul>
                    </div>
                    <div className="space-y-4 p-4 bg-secondary rounded-lg">
                        <h3 className="font-semibold text-lg">Nach bestandener Prüfung</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Automatischer Erhalt des Zertifikats</li>
                            <li>Generierung eines Verifizierungscodes</li>
                            <li>HTML-Code für Ihr Gütesiegel</li>
                            <li>Registrierung in öffentlicher Datenbank</li>
                        </ul>
                    </div>
                </div>

                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" />Wichtige Hinweise</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Die Prüfung kann bei Nichtbestehen wiederholt werden.</li>
                        <li>Alle Hilfsmittel sind während der Prüfung erlaubt.</li>
                        <li>Bei technischen Problemen kontaktieren Sie uns unter: <a href="mailto:office@momofeichtinger.com" className="text-primary hover:underline">office@momofeichtinger.com</a></li>
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4">
                <Button onClick={handleStartExam} size="lg" className="w-full">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Jetzt zur Prüfungsseite wechseln
                </Button>
                <p className="text-xs text-muted-foreground">Wir wünschen Ihnen viel Erfolg bei der Prüfung!</p>
            </CardFooter>
        </Card>
    );
}
