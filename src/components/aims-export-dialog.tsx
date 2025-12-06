
'use client';

import { useState, useEffect } from 'react';
import { getAimsData, getAimsProgress, getFullProject } from '@/lib/data-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Copy, FileJson, FileText, ClipboardCopy, FileType } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { AimsProgress } from '@/lib/data-service';


interface AimsExportData {
  projectName: string;
  scope: string;
  systems: string;
  factors: string;
  departments: string;
  stakeholders: any[];
  policy: string;
  raci: any[];
  risks: any[];
  kpis: string;
  monitoringProcess: string;
  auditRhythm: string;
  improvementProcess: string;
  aimsProgress: AimsProgress;
  generatedAt: string;
}

const generateMarkdown = (data: AimsExportData | null): string => {
    if (!data) return 'Lade Daten...';

    let md = `# AI Management System (AIMS) Dokument - ${data.projectName}\n`;
    md += `_Generiert am: ${new Date(data.generatedAt).toLocaleString('de-DE')}_\n\n`;

    md += `## 1. Geltungsbereich (Scope)\n`;
    md += `**Geltungsbereich:** ${data.scope || 'N/A'}\n`;
    md += `**KI-Systeme:** ${data.systems || 'N/A'}\n`;
    md += `**Interne/Externe Faktoren:** ${data.factors || 'N/A'}\n`;
    md += `**Betroffene Abteilungen:** ${data.departments || 'N/A'}\n\n`;

    md += `## 2. Stakeholder-Analyse\n`;
    if (data.stakeholders?.length > 0) {
        data.stakeholders.forEach((s, i) => {
            md += `### 2.${i+1} ${s.name || 'Unbenannter Stakeholder'}\n`;
            md += `- **Erwartung/Interesse:** ${s.expectation || 'N/A'}\n`;
            md += `- **Einfluss:** ${s.influence || 'N/A'}\n`;
            md += `- **Risiko bei Nichterfüllung:** ${s.risk || 'N/A'}\n`;
            md += `- **Chance bei Erfüllung:** ${s.opportunity || 'N/A'}\n\n`;
        });
    } else {
        md += `_Keine Stakeholder definiert._\n\n`;
    }

    md += `## 3. AI Policy / Leitlinien\n`;
    md += `${data.policy || '_Keine Policy definiert._'}\n\n`;

    md += `## 4. Rollen & Verantwortlichkeiten (RACI)\n`;
    if (data.raci?.length > 0) {
        md += `| Aufgabe | Responsible | Accountable | Consulted | Informed |\n`;
        md += `|---|---|---|---|---|\n`;
        data.raci.forEach(r => {
            md += `| ${r.task || ''} | ${r.responsible || ''} | ${r.accountable || ''} | ${r.consulted || ''} | ${r.informed || ''} |\n`;
        });
        md += `\n`;
    } else {
        md += `_Keine RACI-Matrix definiert._\n\n`;
    }

    md += `## 5. Risiko- & Chancenbewertung\n`;
    if (data.risks?.length > 0) {
        data.risks.forEach((r, i) => {
            md += `### 5.${i+1} Risiko: ${r.description || 'Unbenanntes Risiko'}\n`;
            md += `- **Auswirkung:** ${r.impact || 'N/A'}\n`;
            md += `- **Eintrittswahrscheinlichkeit:** ${r.likelihood || 'N/A'}\n`;
            md += `- **Bestehende Kontrollen:** ${r.controls || 'N/A'}\n`;
            md += `- **Geplante Maßnahmen:** ${r.measures || 'N/A'}\n\n`;
        });
    } else {
        md += `_Keine Risiken definiert._\n\n`;
    }
    
    md += `## 6. Monitoring & Verbesserung\n`;
    md += `**KPIs:** ${data.kpis || 'N/A'}\n`;
    md += `**Monitoring-Prozess:** ${data.monitoringProcess || 'N/A'}\n`;
    md += `**Audit-Rhythmus:** ${data.auditRhythm || 'N/A'}\n`;
    md += `**Verbesserungsprozess:** ${data.improvementProcess || 'N/A'}\n\n`;

    md += `## 7. AIMS-Reifegrad\n`;
    const completedSteps = Object.values(data.aimsProgress || {}).filter(v => v === true).length;
    md += `- **Erfüllte Kernanforderungen:** ${completedSteps} / 6\n`;
    md += `- **Risiken dokumentiert:** ${data.risks?.length > 0 ? 'Ja' : 'Nein'}\n`;
    md += `- **Policies vorhanden:** ${(data.policy || '').length >= 20 ? 'Ja' : 'Nein'}\n`;

    return md;
};

export function AimsExportDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [exportData, setExportData] = useState<AimsExportData | null>(null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [jsonContent, setJsonContent] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setIsLoading(true);
                const project = await getFullProject();
                
                if (project) {
                    const data: AimsExportData = {
                        projectName: project.projectName || 'Unbenanntes Projekt',
                        ...(project.aimsData as any),
                        aimsProgress: project.aimsProgress,
                        generatedAt: new Date().toISOString(),
                    };
                    setExportData(data);
                    setMarkdownContent(generateMarkdown(data));
                    setJsonContent(JSON.stringify(data, null, 2));
                }
                setIsLoading(false);
            };
            fetchData();
        }
    }, [open]);
    
    const handleExportPdf = async () => {
        if (!exportData) return;
        setIsGeneratingPdf(true);
        console.log("Preparing to call 'generateAimsPdf' Cloud Function with payload:", exportData);
        
        try {
            // This part is a placeholder for the actual Cloud Function call.
            // It simulates the call and shows a toast.
            // Once the function is deployed, this will trigger the PDF generation.
            
            // const functions = getFunctions();
            // const generateAimsPdf = httpsCallable(functions, 'generateAimsPdf');
            // const result = await generateAimsPdf({ aimsExport: exportData });
            // const { downloadUrl } = result.data as { downloadUrl: string };
            // window.open(downloadUrl, '_blank');

            toast({
                title: "PDF-Export in Vorbereitung",
                description: "Die serverseitige PDF-Generierung ist noch nicht aktiviert. Bitte deployen Sie die 'generateAimsPdf' Cloud Function.",
                variant: "default",
            });

        } catch (error) {
            console.error("PDF generation call failed:", error);
             toast({
                title: "Fehler beim PDF-Export",
                description: "Der Aufruf der Cloud Function ist fehlgeschlagen. Prüfen Sie die Entwicklerkonsole für Details.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleCopy = (content: string, type: string) => {
        navigator.clipboard.writeText(content);
        toast({ title: 'Kopiert!', description: `Die ${type}-Daten wurden in die Zwischenablage kopiert.` });
    };
    
    const handleDownload = (content: string, type: 'md' | 'json') => {
        const blob = new Blob([content], { type: type === 'md' ? 'text/markdown' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AIMS_Dokument_${exportData?.projectName?.replace(/\s/g, '_') || 'Export'}_${new Date().toISOString().split('T')[0]}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    AIMS-Daten exportieren
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>AIMS-Daten exportieren</DialogTitle>
                    <DialogDescription>
                        Sie können die Inhalte Ihres AI-Managementsystems als strukturierte Datei exportieren oder in die Zwischenablage kopieren.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Tabs defaultValue="markdown" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="markdown">
                                <FileText className="mr-2 h-4 w-4"/> Markdown / Text
                            </TabsTrigger>
                            <TabsTrigger value="json">
                                <FileJson className="mr-2 h-4 w-4"/> Datenstruktur (JSON)
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="markdown">
                             <div className="flex justify-end gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(markdownContent, 'Markdown')}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" /> In die Zwischenablage kopieren
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDownload(markdownContent, 'md')}>
                                    <Download className="mr-2 h-4 w-4" /> Als .md-Datei herunterladen
                                </Button>
                            </div>
                            <Textarea readOnly value={markdownContent} className="h-80 w-full font-mono text-xs" />
                        </TabsContent>
                        <TabsContent value="json">
                             <div className="flex justify-end gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(jsonContent, 'JSON')}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" /> In die Zwischenablage kopieren
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDownload(jsonContent, 'json')}>
                                    <Download className="mr-2 h-4 w-4" /> Als .json-Datei herunterladen
                                </Button>
                            </div>
                            <Textarea readOnly value={jsonContent} className="h-80 w-full font-mono text-xs" />
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter className="sm:justify-between items-center pt-4">
                    <Button variant="outline" onClick={handleExportPdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileType className="mr-2 h-4 w-4" />}
                        PDF-Export
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Schließen</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
