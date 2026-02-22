
'use client';

import { useState, useMemo, ChangeEvent, Fragment, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Printer, PlusCircle, Trash2, Search, ExternalLink, ShieldCheck, ShieldAlert, BadgeCheck, Info, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { ProjectTool } from '@/lib/types';
import { getProjectTools, addProjectTool } from '@/lib/data-service';
import { useRouter } from 'next/navigation';

export type Level = '1' | '2' | '3';


export interface PolicyData {
  title: string;
  content: string;
  placeholders: Record<string, string>;
}

const policies: Record<Level, { title: string; content: string }> = {
  '1': {
    title: 'Policy Level 1: AI‐Commitment Statement',
    // ... (rest of policies object remains same, skipping for brevity in replacement if possible, but tool requires full block if I selected range. I'll make sure StartLine/EndLine matches correctly or I'm replacing the top block.)

    // Wait, I can't skip content in ReplacementContent if I'm replacing a block. 
    // However, I can target just the imports and the component start.

    // Let's split this into two replacements if needed or just replace the top imports and the component start.
    // I'll replace imports first, then Main Component start.

    content: `
**Titel**: Verpflichtung zur verantwortungsbewussten Nutzung von KI-Systemen

**Einleitung / Präambel**
Wir, [Firmenname], erkennen an, dass der EU AI Act neue Anforderungen an den Einsatz von KI stellt. Diese Erklärung soll unseren Mitarbeitenden verdeutlichen, dass wir KI verantwortungsvoll, nachvollziehbar und im Einklang mit europäischen Werten einsetzen wollen.

---

**Abschnitt A: Grundprinzipien (für alle Mitarbeitenden)**

1. Ich verstehe, dass KI-Systeme nur dann eingesetzt werden dürfen, wenn sie nicht gegen verbotene Praktiken gemäß Art. 5 des AI Act verstoßen (z. B. Manipulation, Social Scoring, Emotionserkennung)
2. Ich nutze KI-Tools nur mit Bewusstsein über Datenschutz und Sicherheit – keine Eingabe sensibler personenbezogener Daten in öffentliche KI-Dienste
3. Ich erkenne, dass jede KI-basierte Entscheidung, die Auswirkungen auf Menschen hat, durch eine menschliche Überprüfung ergänzt werden muss
4. Ich bin verpflichtet, mich über verbotsbezogene Änderungen, Leitlinien oder Updates (intern) zu informieren

---

**Abschnitt B: Schulung & Sensibilisierung**
− Ich verpflichte mich, an einer kurzen (z. B. 15-Minuten) Sensibilisierungsschulung teilzunehmen, sofern ich regelmäßig mit KI-Tools arbeite
− Mitarbeitende, die KI namentlich einsetzen oder verantworten, sollen eine vertiefte Schulung absolvieren (extern oder intern)

---

**Unterschriften**
Ort: [Ort]
Datum: [Datum]
Unterschrift Mitarbeitende/r: [Unterschrift Mitarbeitende/r]
    `,
  },
  '2': {
    title: 'Policy Level 2: AI Governance & Nutzungspolicy',
    content: `
**Titel**: Richtlinie zur Governance und Nutzung von KI-Systemen

**1. Geltungsbereich & Zielsetzung**
Diese Richtlinie gilt für alle Abteilungen, Organisatione, Tools und Systeme, die KI einsetzen oder mit KI in Berührung kommen. Ziel ist, den KI-Einsatz in Übereinstimmung mit dem EU AI Act zu steuern, Verantwortlichkeiten zu definieren und Risiken systematisch zu kontrollieren.

**2. Rollen & Verantwortlichkeiten**
* **Geschäftsführung / Leitung**: [Name der Geschäftsführung]
* **KI-Beauftragte/r**: [Name KI-Beauftragte/r]
* **Teamleitung / Abteilungsleitung**: [Name der Teamleitung]
* **KI-Nutzer*innen / Entwickler*innen**: Alle relevanten Mitarbeiter

**3. Risikobasierter Einsatz von KI**
* Jedes KI-System wird vor Einsatz einer **Risikoeinstufung** unterzogen (minimal / begrenzt / hoch)
* Für Hochrisiko-KI gelten strengere Vorgaben: Risikoanalysen, Dokumentation, Logging, menschliche Überwachung
* Logging: Protokolle der Nutzung und Systemfunktionen werden mindestens **6 Monate** aufbewahrt (gemäß Art. 26)
* Mitarbeitende, die mit Hochrisiko-KI arbeiten, werden vor Nutzung informiert und geschult

**4. Inventar der genutzten KI-Tools**
[KI-Tool-Liste]

**5. Transparenz & Kennzeichnung**
* KI-gestützte Inhalte (Texte, Bilder, Entscheidungen) sind klar als solche gekennzeichnet
* Interaktionen, die von KI unterstützt werden, müssen gegenüber Betroffenen transparent gemacht werden (z. B. „Diese Entscheidung wurde mit KI unterstützt“)

**6. Verbotene KI-Systeme & Praktiken**
* Die Nutzung von KI-Systemen, die in die „Verbotenis“-Kategorie fallen (Art. 5), ist strikt untersagt
* Liste verbotener Techniken als Anhang (z. B. Social Scoring, subliminale Signale, biometrische Massenscans etc.)

**7. Schulung & Qualifizierung**
* KI-Nutzer*innen und Entwickler*innen müssen regelmäßige Fortbildungen absolvieren
* Pflicht zur Teilnahme an jährlicher Refresher-Schulung
* Dokumentation über absolvierte Schulungen im Kompetenzregister

**8. Monitoring, Audit & Revision**
* Mindestens einmal im Jahr interne Überprüfung der KI-Nutzungen und Compliance
* Korrekturmaßnahmen bei Abweichungen
* Diese Richtlinie ist alle 12 Monate zu überarbeiten

**9. Inkrafttreten & Unterschriften**
Firmenname: [Firmenname]
Datum Inkrafttreten: [Datum Inkrafttreten]
Unterschriften: [Unterschriften]
    `,
  },
  '3': {
    title: 'Policy Level 3: Technische & Entwickler-Verpflichtung',
    content: `
**Titel**: Richtlinie für technische Entwicklung, Integration und Betrieb von KI-Systemen

**1. Anwendungsbereich**
Diese Richtlinie gilt für jegliche Entwicklung, Integration, Optimierung oder Betrieb von KI-Systemen oder KI-Komponenten bei [Firmenname].

**2. Inventar der genutzten KI-Tools**
[KI-Tool-Liste]

**3. Design & Datenqualität**
* Entwicklerteams müssen beim Design von KI-Systemen Risiken wie Bias, Diskriminierung und Robustheit aktiv adressieren
* Datensätze müssen dokumentiert und geprüft werden (Bias-Analyse, Anonymisierung, Qualitätssicherung)
* Datenherkunft, -verarbeitung und -aufbewahrung müssen nachvollziehbar dokumentiert werden

**4. Validierung, Test & Kontrolle**
* KI-Modelle müssen vor Einsatz validiert und getestet werden (z. B. auf Fairness, Robustheit, Genauigkeit)
* Bei Hochrisiko-Systemen: zusätzlicher Validierungs- und Verifikationsprozess, inkl. externe Überprüfung
* Änderungen am KI-System müssen versioniert und dokumentiert werden

**5. Logging, Monitoring & Alarmierung**
* Automatisiertes Logging von Systemaktivitäten, Ausgaben, Fehlern, besonderen Ereignissen
* Monitoring in Echtzeit, Alarmmechanismen bei Abweichungen
* Logs sind mindestens **6 Monate** aufzubewahren (Art. 26)

**6. Menschliche Kontrolle & Eingriffsmöglichkeiten**
* Jedes KI-System muss eine Funktion zur menschlichen Intervention (Stop/Override) besitzen
* Entwickelte Systeme werden so gestaltet, dass menschliche Kontrolle arbeitsfähig ist

**7. Dokumentation & Compliance-Nachweise**
* Jedes KI-System erhält eine technische und regulatorische Dokumentation (einschließlich Risikobewertung, Testprotokollen, Logging-Konzept)
* Die Dokumentation muss jederzeit auditfähig sein

**8. Sicherheit & Datenschutz**
* Angemessene Sicherheitsmaßnahmen (Verschlüsselung, Zugriffskontrollen) müssen implementiert werden
* Datenschutzprinzipien (Datensparsamkeit, Pseudonymisierung, Zweckbindung) sind einzuhalten

**9. Schulung & Weiterbildung**
* Entwickler*innen müssen regelmäßig Schulungen zu AI-Act-relevanten technischen Anforderungen, ethischen Aspekten und neuen Leitlinien absolvieren
* Teilnahme an Schulungen ist dokumentpflichtig

**10. Inkrafttreten & Unterschriften**
Firmenname: [Firmenname]
Datum: [Datum]
Unterschrift Entwickler*in: [Unterschrift Entwickler*in]
Unterschrift KI-Beauftragte/r: [Unterschrift KI-Beauftragte/r]
    `,
  },
};

const placeholderDetails: Record<string, string> = {
  "Firmenname": "nötig für alle Levels",
  "Ort": "nötig für Level 1",
  "Datum": "nötig für Level 1 & 3",
  "Unterschrift Mitarbeitende/r": "nötig für Level 1",
  "Name der Geschäftsführung": "nötig für Level 2",
  "Name KI-Beauftragte/r": "nötig für Level 2 & 3",
  "Name der Teamleitung": "nötig für Level 2",
  "Datum Inkrafttreten": "nötig für Level 2",
  "Unterschriften": "nötig für Level 2",
  "Unterschrift Entwickler*in": "nötig für Level 3",
  "Unterschrift KI-Beauftragte/r": "nötig für Level 3"
};

const parsePlaceholders = (text: string): string[] => {
  const regex = /\[(.*?)\]/g;
  const matches = text.match(regex) || [];
  const placeholderKeys = matches.map(p => p.slice(1, -1));
  // Filter out the tool list placeholder
  return [...new Set(placeholderKeys)].filter(p => p !== 'KI-Tool-Liste');
};

interface PolicyEditorProps {
  onPolicyChange?: (policyData: { data: PolicyData, level: Level }) => void;
  onSave?: () => void;
  isSaving?: boolean;
  projectId?: string;
}

export function PolicyEditor({ onPolicyChange, onSave, isSaving, projectId }: PolicyEditorProps) {
  const router = useRouter();
  const [employeeCount, setEmployeeCount] = useState<'1-10' | '11-50' | '>50'>('1-10');
  const [aiComplexity, setAiComplexity] = useState<'low' | 'medium' | 'high'>('low');
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});

  // Project Tools State
  const [projectTools, setProjectTools] = useState<ProjectTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      setToolsLoading(true);
      getProjectTools(projectId)
        .then(tools => setProjectTools(tools))
        .catch(err => console.error("Failed to load tools", err))
        .finally(() => setToolsLoading(false));
    }
  }, [projectId]);

  // Legacy Tools State (for migration)
  const [legacyTools, setLegacyTools] = useState<ProjectTool[]>([]);

  const handleImportLegacy = async () => {
    if (!projectId || legacyTools.length === 0) return;
    try {
      let importedCount = 0;
      for (const tool of legacyTools) {
        // Check if already exists by name
        if (projectTools.some(t => t.name.toLowerCase() === tool.name.trim().toLowerCase())) continue;

        await addProjectTool(projectId, {
          name: tool.name,
          vendor: tool.vendor || '',
          url: tool.url || '',
          type: 'saas', // Default
          dataCategories: tool.dataCategories || { personal: false, sensitive: false, none: false, unknown: true },
          review: { status: 'pending', reviewedBy: null, reviewedAt: null, notes: 'Imported from Policy' },
          publicInfo: null,
          category: null
        });
        importedCount++;
      }
      if (importedCount > 0) {
        // Refresh tools
        const updated = await getProjectTools(projectId);
        setProjectTools(updated);
        alert(`${importedCount} Tools erfolgreich importiert.`);
        setLegacyTools([]); // Clear legacy after import
      } else {
        alert("Keine neuen Tools zu importieren (Duplikate übersprungen).");
      }
    } catch (e) {
      console.error(e);
      alert("Fehler beim Importieren.");
    }
  };

  // --- Signature Modal State ---
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [currentSignaturePlaceholder, setCurrentSignaturePlaceholder] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureConsent, setSignatureConsent] = useState(false);



  const openSignatureModal = (placeholder: string) => {
    setCurrentSignaturePlaceholder(placeholder);
    setSignatureName(placeholders[placeholder] || '');
    setIsSignatureModalOpen(true);
    setSignatureConsent(false);
  };

  const confirmSignature = () => {
    if (currentSignaturePlaceholder && signatureName && signatureConsent) {
      setPlaceholders(prev => ({ ...prev, [currentSignaturePlaceholder]: signatureName }));
      setIsSignatureModalOpen(false);
    }
  };
  // -----------------------------

  const recommendedLevel: Level = useMemo(() => {
    if (employeeCount === '>50' || aiComplexity === 'high') return '3';
    if (employeeCount === '11-50' || aiComplexity === 'medium') return '2';
    return '1';
  }, [employeeCount, aiComplexity]);

  const [activeTab, setActiveTab] = useState<Level>(recommendedLevel);

  useEffect(() => {
    setActiveTab(recommendedLevel);
  }, [recommendedLevel]);

  useEffect(() => {
    if (onPolicyChange) {
      onPolicyChange({
        data: {
          title: policies[activeTab].title,
          content: policies[activeTab].content,
          placeholders: placeholders
        },
        level: activeTab
      })
    }
  }, [placeholders, projectTools, activeTab, onPolicyChange]);


  const handlePlaceholderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlaceholders(prev => ({ ...prev, [name]: value }));
  };


  const renderPolicyContent = (content: string) => {
    let filledContent = content;

    // Replace standard placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      if (value) {
        // Format date if key contains "datum"
        const displayValue = (key.toLowerCase().includes('datum') && value.match(/^\d{4}-\d{2}-\d{2}$/))
          ? new Date(value).toLocaleDateString('de-DE')
          : value;

        filledContent = filledContent.replace(new RegExp(`\\[${key}\\]`, 'g'), displayValue);
      }
    });

    // Generate and replace AI tool list
    const toolListText = projectTools.filter(tool => tool.name.trim() !== '').map(tool => {
      const status = tool.review.status === 'approved_internal' ? '(Intern freigegeben)' : '';
      const info = tool.publicInfo ? '[Öffentl. Info vorhanden]' : '';
      return `− ${tool.name.trim()} ${status} ${info}`.trim();
    }).join('\n');

    if (toolListText) {
      filledContent = filledContent.replace('[KI-Tool-Liste]', toolListText);
    } else {
      filledContent = filledContent.replace('**4. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
      filledContent = filledContent.replace('**2. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
    }


    const lines = filledContent.split('\n');
    let listItems: JSX.Element[] = [];
    const groupedLines: (JSX.Element | string)[] = [];

    lines.forEach((line, index) => {
      const uniqueKey = `line-${index}`;
      if (line.trim() === '') {
        if (listItems.length > 0) {
          groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
          listItems = [];
        }
        groupedLines.push(<br key={uniqueKey} />);
      } else if (line.startsWith('---')) {
        if (listItems.length > 0) {
          groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
          listItems = [];
        }
        groupedLines.push(<hr key={uniqueKey} className="my-4" />);
      } else if (line.startsWith('**')) {
        if (listItems.length > 0) {
          groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
          listItems = [];
        }
        groupedLines.push(<h3 key={uniqueKey} className="text-lg font-semibold mt-4">{line.replace(/\*\*/g, '')}</h3>);
      } else if (line.startsWith('− ') || line.match(/^\d\./) || line.startsWith('* ')) {
        const cleanedLine = line.replace(/^(− |\d\. |\* )/, '');
        const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
        listItems.push(<li key={uniqueKey}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</li>);
      } else {
        if (listItems.length > 0) {
          groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
          listItems = [];
        }
        const parts = line.split(/(\*\*.*?\*\*)/g);
        groupedLines.push(<p key={uniqueKey}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</p>);
      }
    });

    if (listItems.length > 0) {
      groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
    }

    return groupedLines;
  };

  const handleCopyText = async () => {
    const policy = policies[activeTab];
    let contentToCopy = policy.content;

    Object.entries(placeholders).forEach(([key, value]) => {
      const displayValue = (key.toLowerCase().includes('datum') && value.match(/^\d{4}-\d{2}-\d{2}$/))
        ? new Date(value).toLocaleDateString('de-DE')
        : (value || `[${key}]`);

      contentToCopy = contentToCopy.replace(new RegExp(`\\[${key}\\]`, 'g'), displayValue);
    });

    const toolListText = projectTools.filter(tool => tool.name.trim() !== '').map(tool => {
      const status = tool.review.status === 'approved_internal' ? '(Intern freigegeben)' : '';
      const info = tool.publicInfo ? '[Öffentl. Info vorhanden]' : '';
      return ` - ${tool.name.trim()} ${status} ${info}`.trim();
    }).join('\n');

    if (toolListText) {
      contentToCopy = contentToCopy.replace('[KI-Tool-Liste]', `\n${toolListText}\n`);
    } else {
      contentToCopy = contentToCopy.replace('**4. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
      contentToCopy = contentToCopy.replace('**2. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
    }

    try {
      await navigator.clipboard.writeText(contentToCopy);
      alert("Text in die Zwischenablage kopiert! Sie können ihn nun in Word oder Google Docs einfügen.");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handlePrint = () => {
    const policy = policies[activeTab];
    let printableContent = policy.content;

    Object.entries(placeholders).forEach(([key, value]) => {
      const displayValue = (key.toLowerCase().includes('datum') && value.match(/^\d{4}-\d{2}-\d{2}$/))
        ? new Date(value).toLocaleDateString('de-DE')
        : (value || `[${key}]`);

      printableContent = printableContent.replace(new RegExp(`\\[${key}\\]`, 'g'), displayValue);
    });

    const toolListText = projectTools.filter(tool => tool.name.trim() !== '').map(tool => {
      const status = tool.review.status === 'approved_internal' ? '(Intern freigegeben)' : '';
      const info = tool.publicInfo ? '[Öffentl. Info vorhanden]' : '';
      return ` - ${tool.name.trim()} ${status} ${info}`.trim();
    }).join('\n');

    if (toolListText) {
      printableContent = printableContent.replace('[KI-Tool-Liste]', `\n${toolListText}\n`);
    } else {
      printableContent = printableContent.replace('**4. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
      printableContent = printableContent.replace('**2. Inventar der genutzten KI-Tools**\n[KI-Tool-Liste]\n', '');
    }

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
        <html>
            <head>
                <title>${policy.title}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; }
                    h1, h2, h3 { font-weight: bold; margin-top: 1.5em; }
                    h1 { font-size: 1.5em; }
                    h2 { font-size: 1.2em; }
                    h3 { font-size: 1.1em; }
                    hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
                    ul, ol { padding-left: 20px; }
                </style>
            </head>
            <body>
                <h1>${policy.title}</h1>
                ${printableContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>').replace(/<br><br>/g, '<br>')}
            </body>
        </html>
    `);
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => { printWindow?.print(); }, 500);
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-800" />
        <div className="ml-2">
          <AlertTitle className="text-blue-900 font-semibold">Zentrale Verwaltung</AlertTitle>
          <AlertDescription className="text-blue-800">
            Diese Richtlinie bezieht sich auf das zuvor angelegte KI-Organisation.
            Die Tools werden nun zentral im "Tools & Systeme" Tab verwaltet und hier automatisch synchronisiert.
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Configuration */}
        <div className="md:col-span-1 space-y-6 sticky top-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Selbsteinschätzung</CardTitle>
              <CardDescription>Bestimmen Sie das passende Level für Ihr Unternehmen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Anzahl der Mitarbeiter</Label>
                <RadioGroup value={employeeCount} onValueChange={(v: any) => setEmployeeCount(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-10" id="emp1" />
                    <Label htmlFor="emp1">Bis zu 10</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="11-50" id="emp2" />
                    <Label htmlFor="emp2">11 - 50</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value=">50" id="emp3" />
                    <Label htmlFor="emp3">Mehr als 50</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Komplexität des KI-Einsatzes</Label>
                <RadioGroup value={aiComplexity} onValueChange={(v: any) => setAiComplexity(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="ai1" />
                    <Label htmlFor="ai1">Gering (z.B. nur Text-/Bildgenerierung)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="ai2" />
                    <Label htmlFor="ai2">Mittel (z.B. Chatbots, Prozessautomatisierung)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="ai3" />
                    <Label htmlFor="ai3">Hoch (z.B. Entscheidungsfindung, HR, kritische Systeme)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Platzhalter ausfüllen</CardTitle>
              <CardDescription>Diese Werte werden in allen Policen automatisch ersetzt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsePlaceholders(Object.values(policies).map(p => p.content).join('\n')).map(p => (
                <div key={p}>
                  <Label htmlFor={p} className="capitalize flex justify-between items-center">
                    <span>{p.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground font-normal">{placeholderDetails[p] || ''}</span>
                  </Label>
                  {p.toLowerCase().includes('unterschrift') ? (
                    <div className="flex gap-2">
                      <Input
                        id={p}
                        name={p}
                        readOnly
                        value={placeholders[p] || ''}
                        placeholder="Zum Unterschreiben klicken..."
                        className="mt-1 cursor-pointer font-['Brush_Script_MT',_cursive] text-xl text-blue-800"
                        onClick={() => openSignatureModal(p)}
                      />
                      <Button variant="outline" className="mt-1" onClick={() => openSignatureModal(p)}>
                        ✐
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id={p}
                      name={p}
                      type={p.toLowerCase().includes('datum') || p.toLowerCase().includes('date') ? "date" : "text"}
                      value={placeholders[p] || ''}
                      onChange={handlePlaceholderChange}
                      placeholder={`Wert für '${p}' eingeben`}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Digitale Unterschrift</DialogTitle>
                <DialogDescription>
                  Bitte bestätigen Sie Ihre Identität und die Rechtsgültigkeit dieser Unterschrift.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sig-name">Ihr Name (in Druckbuchstaben)</Label>
                  <Input
                    id="sig-name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Vorname Nachname"
                  />
                </div>

                <div className="p-4 bg-secondary/30 rounded-lg border border-dashed border-gray-300 text-center">
                  <Label className="text-xs text-muted-foreground mb-2 block">Vorschau</Label>
                  <p className="text-3xl font-['Brush_Script_MT',_cursive] text-blue-800 min-h-[40px]">
                    {signatureName || 'Ihre Unterschrift'}
                  </p>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="sig-consent"
                    checked={signatureConsent}
                    onCheckedChange={(c) => setSignatureConsent(!!c)}
                  />
                  <Label htmlFor="sig-consent" className="text-sm leading-tight text-muted-foreground font-normal">
                    Ich bestätige, dass diese digitale Unterschrift meiner handschriftlichen Unterschrift gleichgestellt ist und ich den Inhalt des Dokuments verstanden und akzeptiert habe.
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSignatureModalOpen(false)}>Abbrechen</Button>
                <Button onClick={confirmSignature} disabled={!signatureName || !signatureConsent}>Unterschreiben</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>3. Genutzte KI-Tools</CardTitle>
              <CardDescription>
                Diese Liste wird nun zentral über den "Tools"-Tab verwaltet.
                Hier sehen Sie die aktuelle "Single Source of Truth".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Legacy Import Banner */}
              {projectTools.length === 0 && legacyTools.length > 0 && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-800" />
                  <AlertTitle className="text-amber-900">Alte Daten gefunden</AlertTitle>
                  <AlertDescription className="text-amber-800 block">
                    Wir haben {legacyTools.length} Tools in Ihrer lokalen Policy gefunden, aber das Organisation ist noch leer.
                    <Button size="sm" variant="outline" className="mt-2 w-full border-amber-300 hover:bg-amber-100 text-amber-900" onClick={handleImportLegacy}>
                      Diese Tools jetzt in das Organisation importieren
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {projectTools.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground border border-dashed rounded bg-muted/30">
                  <p className="text-sm">Keine Tools im Organisation hinterlegt.</p>
                  <p className="text-xs mt-1">Gehen Sie zum Dashboard, um Tools hinzuzufügen.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectTools.map((tool, i) => (
                    <div key={tool.id} className="flex items-center justify-between p-2 border rounded bg-slate-50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <BadgeCheck className={tool.review.status === 'approved_internal' ? "h-4 w-4 text-green-600" : "h-4 w-4 text-gray-400"} />
                        <span className="font-medium text-sm truncate">{tool.name}</span>
                        {tool.vendor && <span className="text-xs text-muted-foreground hidden sm:inline">({tool.vendor})</span>}
                      </div>
                      <div className="flex gap-1">
                        {tool.publicInfo ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                            Info da
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                            Keine Info
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t mt-4">
                <p className="text-xs text-muted-foreground">
                  Hinweis: Änderungen bitte im "Tools & Systeme" Tab vornehmen.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Policies */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Level)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">Level 1</TabsTrigger>
              <TabsTrigger value="2">Level 2</TabsTrigger>
              <TabsTrigger value="3">Level 3</TabsTrigger>
            </TabsList>
            {(Object.keys(policies) as Level[]).map((level) => {
              return (
                <TabsContent value={level} key={level}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{policies[level].title}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none printable-content">
                      {renderPolicyContent(policies[level].content)}
                    </CardContent>
                    <CardFooter className="flex gap-2 justify-end">
                      <Button onClick={handleCopyText} variant="outline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        Als Text kopieren
                      </Button>
                      <Button onClick={handlePrint} variant="secondary">
                        <Printer className="mr-2 h-4 w-4" /> Drucken / PDF
                      </Button>
                      {onSave && (
                        <Button onClick={onSave} disabled={isSaving} className="ml-auto bg-green-600 hover:bg-green-700 text-white">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                          Speichern & Fertigstellen
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div >
    </div >
  );
}
