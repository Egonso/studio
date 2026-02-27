'use client';

import { useState, useEffect } from 'react';
import { getPortfolioProjects, getActiveProjectId } from '@/lib/data-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, FileJson, FileText, ClipboardCopy, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AIProject, AIProjectAssessment } from '@/lib/types-portfolio';

interface PortfolioExportData {
    projectName: string;
    projects: (AIProject & { assessment?: AIProjectAssessment })[];
    generatedAt: string;
}

const generateMarkdown = (data: PortfolioExportData | null): string => {
    if (!data) return 'Lade Daten...';

    let md = `# KI-Portfolio Strategie Report - ${data.projectName}\n`;
    md += `_Generiert am: ${new Date(data.generatedAt).toLocaleString('de-DE')}_\n\n`;

    md += `## Zusammenfassung\n`;
    md += `- **Gesamtzahl Organisatione:** ${data.projects.length}\n`;
    const highValue = data.projects.filter(p => (p.assessment?.businessValue || 0) >= 4).length;
    const highRisk = data.projects.filter(p => (p.assessment?.governanceRisk || 0) >= 4).length;
    md += `- **Organisatione mit hohem Business Value (≥4):** ${highValue}\n`;
    md += `- **Organisatione mit hohem Risiko (≥4):** ${highRisk}\n\n`;

    md += `## Organisationübersicht\n\n`;

    if (data.projects.length === 0) {
        md += `_Keine KI-Organisatione im Portfolio._\n\n`;
    } else {
        data.projects.forEach((project, i) => {
            md += `### ${i + 1}. ${project.title || 'Unbenanntes Organisation'}\n`;
            md += `- **Status:** ${project.status || 'N/A'}\n`;
            md += `- **Business Owner:** ${project.businessOwner || 'N/A'}\n`;
            md += `- **Fachbereich:** ${project.department || 'N/A'}\n`;
            md += `- **Beschreibung:** ${project.description || 'N/A'}\n`;
            if (project.assessment) {
                md += `\n**Bewertung:**\n`;
                md += `- Business Value: ${project.assessment.businessValue}/5\n`;
                md += `- Implementierungsaufwand: ${project.assessment.implementationEffort}/5\n`;
                md += `- Governance Risiko: ${project.assessment.governanceRisk}/5\n`;
            }
            md += `\n---\n\n`;
        });
    }

    return md;
};

export function PortfolioExportDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [markdownContent, setMarkdownContent] = useState('');
    const [jsonContent, setJsonContent] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setIsLoading(true);
                const projects = await getPortfolioProjects();
                const projectId = getActiveProjectId();

                const data: PortfolioExportData = {
                    projectName: projectId || 'Portfolio',
                    projects: projects,
                    generatedAt: new Date().toISOString(),
                };
                setMarkdownContent(generateMarkdown(data));
                setJsonContent(JSON.stringify(data, null, 2));
                setIsLoading(false);
            };
            fetchData();
        }
    }, [open]);

    const handleCopy = (content: string, type: string) => {
        navigator.clipboard.writeText(content);
        toast({ title: 'Kopiert!', description: `Die ${type}-Daten wurden in die Zwischenablage kopiert.` });
    };

    const handleDownload = (content: string, type: 'md' | 'json') => {
        const blob = new Blob([content], { type: type === 'md' ? 'text/markdown' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Portfolio_Report_${new Date().toISOString().split('T')[0]}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Portfolio Report</title>
                <style>body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }</style>
                </head>
                <body><pre style="white-space: pre-wrap;">${markdownContent}</pre></body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Portfolio exportieren
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Portfolio-Daten exportieren</DialogTitle>
                    <DialogDescription>
                        Exportieren Sie Ihre KI-Portfolio-Strategie als strukturierte Datei.
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
                                <FileText className="mr-2 h-4 w-4" /> Markdown / Text
                            </TabsTrigger>
                            <TabsTrigger value="json">
                                <FileJson className="mr-2 h-4 w-4" /> Datenstruktur (JSON)
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="markdown">
                            <div className="flex justify-end gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(markdownContent, 'Markdown')}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" /> Kopieren
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDownload(markdownContent, 'md')}>
                                    <Download className="mr-2 h-4 w-4" /> Als .md herunterladen
                                </Button>
                            </div>
                            <Textarea readOnly value={markdownContent} className="h-80 w-full font-mono text-xs" />
                        </TabsContent>
                        <TabsContent value="json">
                            <div className="flex justify-end gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(jsonContent, 'JSON')}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" /> Kopieren
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDownload(jsonContent, 'json')}>
                                    <Download className="mr-2 h-4 w-4" /> Als .json herunterladen
                                </Button>
                            </div>
                            <Textarea readOnly value={jsonContent} className="h-80 w-full font-mono text-xs" />
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter className="sm:justify-between items-center pt-4">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Drucken / Als PDF
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Schließen</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
