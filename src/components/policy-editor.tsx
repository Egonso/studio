
'use client';

import { useState, useMemo, ChangeEvent, Fragment, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Printer, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';

type Level = '1' | '2' | '3';
type AiTool = { name: string; isDsgvoCompliant: boolean; isEuAiActCompliant: boolean; };

const policies: Record<Level, { title: string; content: string }> = {
  '1': {
    title: 'Policy Level 1: AI‐Commitment Statement',
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
Ort, Datum: [Ort, Datum]
Unterschrift Mitarbeitende/r: [Unterschrift Mitarbeitende/r]
    `,
  },
  '2': {
    title: 'Policy Level 2: AI Governance & Nutzungspolicy',
    content: `
**Titel**: Richtlinie zur Governance und Nutzung von KI-Systemen

**1. Geltungsbereich & Zielsetzung**
Diese Richtlinie gilt für alle Abteilungen, Projekte, Tools und Systeme, die KI einsetzen oder mit KI in Berührung kommen. Ziel ist, den KI-Einsatz in Übereinstimmung mit dem EU AI Act zu steuern, Verantwortlichkeiten zu definieren und Risiken systematisch zu kontrollieren.

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
    "Ort, Datum": "nötig für Level 1",
    "Unterschrift Mitarbeitende/r": "nötig für Level 1",
    "Name der Geschäftsführung": "nötig für Level 2",
    "Name KI-Beauftragte/r": "nötig für Level 2 & 3",
    "Name der Teamleitung": "nötig für Level 2",
    "Datum Inkrafttreten": "nötig für Level 2",
    "Unterschriften": "nötig für Level 2",
    "Datum": "nötig für Level 3",
    "Unterschrift Entwickler*in": "nötig für Level 3"
};

const parsePlaceholders = (text: string): string[] => {
    const regex = /\[(.*?)\]/g;
    const matches = text.match(regex) || [];
    const placeholderKeys = matches.map(p => p.slice(1, -1));
    // Filter out the tool list placeholder
    return [...new Set(placeholderKeys)].filter(p => p !== 'KI-Tool-Liste');
};

export function PolicyEditor() {
  const [employeeCount, setEmployeeCount] = useState<'1-10' | '11-50' | '>50'>('1-10');
  const [aiComplexity, setAiComplexity] = useState<'low' | 'medium' | 'high'>('low');
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [aiTools, setAiTools] = useState<AiTool[]>([{ name: '', isDsgvoCompliant: false, isEuAiActCompliant: false }]);

  const recommendedLevel: Level = useMemo(() => {
    if (employeeCount === '>50' || aiComplexity === 'high') return '3';
    if (employeeCount === '11-50' || aiComplexity === 'medium') return '2';
    return '1';
  }, [employeeCount, aiComplexity]);

  const [activeTab, setActiveTab] = useState<Level>(recommendedLevel);

  useEffect(() => {
    setActiveTab(recommendedLevel);
  }, [recommendedLevel]);

  const handlePlaceholderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlaceholders(prev => ({ ...prev, [name]: value }));
  };

  const handleToolChange = (index: number, field: keyof AiTool, value: string | boolean) => {
    const newTools = [...aiTools];
    (newTools[index] as any)[field] = value;
    setAiTools(newTools);
  };

  const addTool = () => {
    setAiTools([...aiTools, { name: '', isDsgvoCompliant: false, isEuAiActCompliant: false }]);
  };

  const removeTool = (index: number) => {
    if (aiTools.length > 1) {
        setAiTools(aiTools.filter((_, i) => i !== index));
    } else {
        // Clear the last remaining item instead of removing it
        setAiTools([{ name: '', isDsgvoCompliant: false, isEuAiActCompliant: false }]);
    }
  };

  const renderPolicyContent = (content: string) => {
    let filledContent = content;
    
    // Replace standard placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      if (value) {
        filledContent = filledContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
      }
    });

    // Generate and replace AI tool list
    const toolListText = aiTools.filter(tool => tool.name.trim() !== '').map(tool => {
        const dsgvo = tool.isDsgvoCompliant ? '(DSGVO-konform)' : '';
        const euAct = tool.isEuAiActCompliant ? '(EU-AI-Act-konform)' : '';
        return `− ${tool.name.trim()} ${dsgvo} ${euAct}`.trim();
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
  
  const handlePrint = () => {
    const policy = policies[activeTab];
    let printableContent = policy.content;
    
    Object.entries(placeholders).forEach(([key, value]) => {
        printableContent = printableContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || `[${key}]`);
    });

    const toolListText = aiTools.filter(tool => tool.name.trim() !== '').map(tool => {
        const dsgvo = tool.isDsgvoCompliant ? '(DSGVO-konform)' : '';
        const euAct = tool.isEuAiActCompliant ? '(EU-AI-Act-konform)' : '';
        return ` - ${tool.name.trim()} ${dsgvo} ${euAct}`.trim();
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
                        <Input 
                            id={p} 
                            name={p} 
                            value={placeholders[p] || ''}
                            onChange={handlePlaceholderChange} 
                            placeholder={`Wert für '${p}' eingeben`}
                            className="mt-1"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>3. Genutzte KI-Tools</CardTitle>
                <CardDescription>Führen Sie hier eine Liste der KI-Tools, die im Unternehmen genutzt werden (erscheint in Level 2 & 3 Policen).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {aiTools.map((tool, index) => (
                    <div key={index} className="p-3 rounded-md border bg-secondary/50 space-y-3">
                         <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`tool-name-${index}`} className="sr-only">Name des KI-Tools</Label>
                                <Input 
                                    id={`tool-name-${index}`}
                                    placeholder="Name des KI-Tools (z.B. ChatGPT)"
                                    value={tool.name}
                                    onChange={(e) => handleToolChange(index, 'name', e.target.value)}
                                    className="flex-grow"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeTool(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label className="text-xs">Konformitäts-Check (optional):</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`dsgvo-${index}`} 
                                    checked={tool.isDsgvoCompliant} 
                                    onCheckedChange={(checked) => handleToolChange(index, 'isDsgvoCompliant', !!checked)}
                                />
                                <Label htmlFor={`dsgvo-${index}`} className="text-sm font-normal">DSGVO-konform</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`euai-${index}`}
                                    checked={tool.isEuAiActCompliant}
                                    onCheckedChange={(checked) => handleToolChange(index, 'isEuAiActCompliant', !!checked)}
                                />
                                <Label htmlFor={`euai-${index}`} className="text-sm font-normal">EU-AI-Act-konform</Label>
                            </div>
                        </div>
                    </div>
                ))}
                 <Button variant="outline" onClick={addTool} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tool hinzufügen
                </Button>
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
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4"/> Drucken / PDF
                    </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

    