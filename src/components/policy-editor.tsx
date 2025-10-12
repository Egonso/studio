
'use client';

import { useState, useMemo, ChangeEvent, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Printer, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Level = '1' | '2' | '3';

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

**4. Transparenz & Kennzeichnung**
* KI-gestützte Inhalte (Texte, Bilder, Entscheidungen) sind klar als solche gekennzeichnet
* Interaktionen, die von KI unterstützt werden, müssen gegenüber Betroffenen transparent gemacht werden (z. B. „Diese Entscheidung wurde mit KI unterstützt“)

**5. Verbotene KI-Systeme & Praktiken**
* Die Nutzung von KI-Systemen, die in die „Verbotenis“-Kategorie fallen (Art. 5), ist strikt untersagt
* Liste verbotener Techniken als Anhang (z. B. Social Scoring, subliminale Signale, biometrische Massenscans etc.)

**6. Schulung & Qualifizierung**
* KI-Nutzer*innen und Entwickler*innen müssen regelmäßige Fortbildungen absolvieren
* Pflicht zur Teilnahme an jährlicher Refresher-Schulung
* Dokumentation über absolvierte Schulungen im Kompetenzregister

**7. Monitoring, Audit & Revision**
* Mindestens einmal im Jahr interne Überprüfung der KI-Nutzungen und Compliance
* Korrekturmaßnahmen bei Abweichungen
* Diese Richtlinie ist alle 12 Monate zu überarbeiten

**8. Inkrafttreten & Unterschriften**
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

**2. Design & Datenqualität**
* Entwicklerteams müssen beim Design von KI-Systemen Risiken wie Bias, Diskriminierung und Robustheit aktiv adressieren
* Datensätze müssen dokumentiert und geprüft werden (Bias-Analyse, Anonymisierung, Qualitätssicherung)
* Datenherkunft, -verarbeitung und -aufbewahrung müssen nachvollziehbar dokumentiert werden

**3. Validierung, Test & Kontrolle**
* KI-Modelle müssen vor Einsatz validiert und getestet werden (z. B. auf Fairness, Robustheit, Genauigkeit)
* Bei Hochrisiko-Systemen: zusätzlicher Validierungs- und Verifikationsprozess, inkl. externe Überprüfung
* Änderungen am KI-System müssen versioniert und dokumentiert werden

**4. Logging, Monitoring & Alarmierung**
* Automatisiertes Logging von Systemaktivitäten, Ausgaben, Fehlern, besonderen Ereignissen
* Monitoring in Echtzeit, Alarmmechanismen bei Abweichungen
* Logs sind mindestens **6 Monate** aufzubewahren (Art. 26)

**5. Menschliche Kontrolle & Eingriffsmöglichkeiten**
* Jedes KI-System muss eine Funktion zur menschlichen Intervention (Stop/Override) besitzen
* Entwickelte Systeme werden so gestaltet, dass menschliche Kontrolle arbeitsfähig ist

**6. Dokumentation & Compliance-Nachweise**
* Jedes KI-System erhält eine technische und regulatorische Dokumentation (einschließlich Risikobewertung, Testprotokollen, Logging-Konzept)
* Die Dokumentation muss jederzeit auditfähig sein

**7. Sicherheit & Datenschutz**
* Angemessene Sicherheitsmaßnahmen (Verschlüsselung, Zugriffskontrollen) müssen implementiert werden
* Datenschutzprinzipien (Datensparsamkeit, Pseudonymisierung, Zweckbindung) sind einzuhalten

**8. Schulung & Weiterbildung**
* Entwickler*innen müssen regelmäßig Schulungen zu AI-Act-relevanten technischen Anforderungen, ethischen Aspekten und neuen Leitlinien absolvieren
* Teilnahme an Schulungen ist dokumentpflichtig

**9. Inkrafttreten & Unterschriften**
Firmenname: [Firmenname]
Datum: [Datum]
Unterschrift Entwickler*in: [Unterschrift Entwickler*in]
Unterschrift KI-Beauftragte/r: [Unterschrift KI-Beauftragte/r]
    `,
  },
};

const parsePlaceholders = (text: string): string[] => {
    const regex = /\[(.*?)\]/g;
    const matches = text.match(regex) || [];
    // Deduplicate and clean up brackets
    return [...new Set(matches.map(p => p.slice(1, -1)))];
};

export function PolicyEditor() {
  const [employeeCount, setEmployeeCount] = useState<'1-10' | '11-50' | '>50'>('1-10');
  const [aiComplexity, setAiComplexity] = useState<'low' | 'medium' | 'high'>('low');
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const recommendedLevel: Level = useMemo(() => {
    if (employeeCount === '>50' || aiComplexity === 'high') return '3';
    if (employeeCount === '11-50' || aiComplexity === 'medium') return '2';
    return '1';
  }, [employeeCount, aiComplexity]);

  const handlePlaceholderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlaceholders(prev => ({ ...prev, [name]: value }));
  };

  const renderPolicyContent = (content: string) => {
    let renderedContent = content;
    Object.entries(placeholders).forEach(([key, value]) => {
      if (value) {
        renderedContent = renderedContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
      }
    });

    const lines = renderedContent.split('\n').map((line, index) => {
      if (line.trim() === '') return { type: 'empty', key: `empty-${index}` };
      if (line.startsWith('---')) return { type: 'hr', key: `hr-${index}` };
      if (line.startsWith('**')) return { type: 'h3', content: line.replace(/\*\*/g, ''), key: `h3-${index}` };
      if (line.startsWith('* ') || line.startsWith('− ') || line.match(/^\d\./)) {
        return { type: 'li', content: line.substring(2), key: `li-${index}` };
      }
      return { type: 'p', content: line, key: `p-${index}` };
    });
    
    const groupedElements: JSX.Element[] = [];
    let currentList: { type: string, content: string, key: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.type === 'li') {
            currentList.push(line);
        } else {
            if (currentList.length > 0) {
                groupedElements.push(
                    <ul key={`ul-${i - currentList.length}`} className="list-disc pl-5 space-y-1 my-2">
                        {currentList.map(item => (
                             <li key={item.key}>{item.content}</li>
                        ))}
                    </ul>
                );
                currentList = [];
            }
            if (line.type === 'hr') {
                groupedElements.push(<hr key={line.key} className="my-4" />);
            } else if (line.type === 'h3') {
                groupedElements.push(<h3 key={line.key} className="text-lg font-semibold mt-4">{line.content}</h3>);
            } else if (line.type === 'p') {
                const parts = line.content.split(/(\*\*.*?\*\*)/g);
                groupedElements.push(<p key={line.key}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</p>);
            }
             // empty lines are skipped
        }
    }
    if (currentList.length > 0) {
        groupedElements.push(
            <ul key={`ul-${lines.length}`} className="list-disc pl-5 space-y-1 my-2">
                 {currentList.map(item => (
                    <li key={item.key}>{item.content}</li>
                ))}
            </ul>
        );
    }
    
    return groupedElements;
  };
  
  const handlePrint = (level: Level) => {
    const policy = policies[level];
    let printableContent = policy.content;
    
    Object.entries(placeholders).forEach(([key, value]) => {
        printableContent = printableContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || `[${key}]`);
    });

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
        <html>
            <head>
                <title>${policy.title}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; }
                    h2, h3 { font-weight: bold; margin-top: 1.5em; }
                    hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
                    ul { padding-left: 20px; }
                </style>
            </head>
            <body>
                <h1>${policy.title}</h1>
                ${printableContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </body>
        </html>
    `);
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => { printWindow?.print(); }, 500);
  }

  const handleShare = () => {
    toast({
      title: "Funktion in Entwicklung",
      description: "Das Teilen von Dokumenten zur digitalen Signatur wird in einer zukünftigen Version verfügbar sein.",
    });
  };

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
            <CardContent className="space-y-3">
                {parsePlaceholders(Object.values(policies).map(p => p.content).join('\n')).map(p => (
                     <div key={p}>
                        <Label htmlFor={p} className="capitalize">{p.replace(/_/g, ' ')}</Label>
                        <Input 
                            id={p} 
                            name={p} 
                            value={placeholders[p] || ''}
                            onChange={handlePlaceholderChange} 
                            placeholder={`Wert für '${p}' eingeben`}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      {/* Right Column: Policies */}
      <div className="md:col-span-2">
        <Tabs defaultValue={recommendedLevel} value={recommendedLevel} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1">Level 1</TabsTrigger>
            <TabsTrigger value="2">Level 2</TabsTrigger>
            <TabsTrigger value="3">Level 3</TabsTrigger>
          </TabsList>
          {Object.entries(policies).map(([level, policy]) => (
            <TabsContent value={level} key={level}>
              <Card>
                <CardHeader>
                  <CardTitle>{policy.title}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none printable-content">
                    {renderPolicyContent(policy.content)}
                </CardContent>
                <CardContent className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => handleShare()}>
                        <Link2 className="mr-2"/> Digital teilen
                    </Button>
                    <Button onClick={() => handlePrint(level as Level)}>
                        <Printer className="mr-2"/> Drucken / PDF
                    </Button>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

    

    