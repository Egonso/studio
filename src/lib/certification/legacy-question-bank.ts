import type { ExamDefinition, ExamQuestion, ExamSection } from './types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const rawExamSections: Array<
  Omit<ExamSection, 'id' | 'questions'> & {
    questions: Array<Omit<ExamQuestion, 'id'>>;
  }
> = [
  {
    title: "Modul 1 – Technische Essentials",
    questions: [
      {
        text: "Was ist die grundlegende Idee hinter Neuronalen Netzen in der KI?",
        options: [
          "Sie speichern riesige Datenbanken effizient.",
          "Sie ahmen die Struktur und Funktionsweise des menschlichen Gehirns nach, um aus Daten zu lernen.",
          "Sie führen komplexe mathematische Berechnungen schneller als herkömmliche Computer durch.",
          "Sie sind hauptsächlich für die Verschlüsselung von Daten zuständig."
        ],
        correctAnswer: 1,
        explanation: "Neuronale Netze sind von biologischen neuronalen Netzen inspiriert und nutzen Schichten von „Neuronen\" mit gewichteten Verbindungen, um Muster in Daten zu erkennen, was eine Kernfunktion menschlicher Intelligenz nachahmt."
      },
      {
        text: "Was versteht man unter „Tokenisierung\" im Kontext von Sprachmodellen?",
        options: [
          "Das Verschlüsseln von Textnachrichten.",
          "Das Zerlegen von Text in kleinere Einheiten (Wörter, Wortteile).",
          "Das Umwandeln von Text in eine Zahlenliste (Vektor).",
          "Das Trainieren eines Modells auf spezifische Fachbegriffe."
        ],
        correctAnswer: 1,
        explanation: "Tokenisierung ist der Prozess, bei dem ein Eingabetext in grundlegende Einheiten zerlegt wird, die das Modell verarbeiten kann."
      },
      {
        text: "Welche Technologie ist zentral für die Leistungsfähigkeit moderner LLMs wie GPT?",
        options: [
          "Die Blockchain-Technologie.",
          "Relationale Datenbanken.",
          "Die Transformer-Architektur mit Self-Attention.",
          "Entscheidungsbaum-Algorithmen."
        ],
        correctAnswer: 2,
        explanation: "Die Transformer-Architektur, insbesondere der Self-Attention-Mechanismus, ermöglicht es Modellen, Kontexte und Beziehungen zwischen Wörtern auch über längere Textabschnitte hinweg zu verstehen und zu gewichten."
      },
      {
        text: "Was ist der Hauptzweck von Retrieval Augmented Generation (RAG)?",
        options: [
          "Das Trainieren von KI-Modellen mit völlig neuen Daten.",
          "Das Generieren von möglichst kreativen und fiktiven Texten.",
          "Das Kombinieren von LLM-Fähigkeiten mit dem Abrufen relevanter Informationen aus einer externen Wissensbasis.",
          "Das automatische Verbessern der Grammatik in KI-generierten Texten."
        ],
        correctAnswer: 2,
        explanation: "RAG erlaubt es einem LLM, vor der Generierung einer Antwort spezifische Informationen abzurufen, um Halluzinationen zu reduzieren und Antworten auf verifizierten Quellen zu basieren."
      },
      {
        text: "Welcher potenzielle Vorteil von Offline- oder Open-Source-LLMs wird oft für KMUs hervorgehoben?",
        options: [
          "Sie sind immer leistungsfähiger als Cloud-basierte Modelle wie GPT-4.",
          "Sie bieten potenziell mehr Kontrolle über Datenschutz und Datensicherheit, da Daten das Unternehmen nicht verlassen müssen.",
          "Sie erfordern absolut keine technische Expertise zur Einrichtung.",
          "Sie werden täglich automatisch mit den neuesten Informationen aktualisiert."
        ],
        correctAnswer: 1,
        explanation: "Da die Modelle lokal betrieben werden können, können sensible Unternehmensdaten besser geschützt werden, da sie nicht an externe Cloud-Anbieter gesendet werden müssen."
      },
      {
        text: "Was versteht man unter „Halluzinationen\" bei KI-Modellen?",
        options: [
          "Die Fähigkeit der KI, kreative Bilder zu erzeugen.",
          "Fehlermeldungen, die das System bei Überlastung ausgibt.",
          "Wenn die KI überzeugend klingende, aber faktisch falsche oder frei erfundene Informationen generiert.",
          "Visuelle Effekte, die bei der Interaktion mit der KI auftreten können."
        ],
        correctAnswer: 2,
        explanation: "Halluzinationen treten auf, wenn ein LLM Wissenslücken mit plausibel klingenden, aber unzutreffenden oder erfundenen Aussagen füllt."
      },
      {
        text: "Welches Prinzip des Datenschutzes ist bei der Entwicklung von KI besonders relevant und bedeutet, Datenschutz von Anfang an zu berücksichtigen?",
        options: [
          "Privacy by Obscurity (Schutz durch Unklarheit).",
          "Privacy by Policy (Schutz durch Richtlinien).",
          "Privacy by Design (Datenschutz durch Technikgestaltung).",
          "Privacy by Default (Standardmäßig datenschutzfreundliche Voreinstellungen)."
        ],
        correctAnswer: 2,
        explanation: "Privacy by Design (Artikel 25 DSGVO) fordert, dass Datenschutzaspekte bereits bei der Konzeption und Entwicklung von Systemen technisch und organisatorisch implementiert werden."
      },
      {
        text: "Was ist ein möglicher \"Bias\" in einem KI-System?",
        options: [
          "Eine absichtlich eingebaute Fehlfunktion.",
          "Die Geschwindigkeit, mit der das System lernt.",
          "Ein notwendiges Feature zur Verbesserung der Genauigkeit.",
          "Die Tendenz des Systems, systematisch bestimmte Gruppen zu benachteiligen oder falsche Annahmen zu treffen, oft aufgrund unausgewogener Trainingsdaten."
        ],
        correctAnswer: 3,
        explanation: "Bias in der KI bezieht sich auf systematische Verzerrungen, die dazu führen, dass die KI unfaire, ungenaue oder diskriminierende Ergebnisse liefert."
      },
      {
        text: "Welche Aufgabe erfüllt der \"System Prompt\" beim Prompt Engineering?",
        options: [
          "Er gibt der KI eine Rolle, Anweisungen oder Kontext vor, bevor der User-Prompt verarbeitet wird.",
          "Er enthält die eigentliche Frage des Benutzers an die KI.",
          "Er ist eine Zusammenfassung der KI-Antwort.",
          "Er dient ausschließlich zur Fehlerbehebung."
        ],
        correctAnswer: 0,
        explanation: "Der System Prompt wird genutzt, um das Verhalten der KI zu steuern, indem er ihr eine Rolle oder Grundanweisungen gibt, um den Rahmen für die Interaktion zu setzen."
      },
      {
        text: "Was bedeutet \"Security by Design\" im Kontext von KI-Systemen?",
        options: [
          "Sicherheitsmaßnahmen werden von Anfang an in die Architektur des KI-Systems integriert.",
          "Die KI soll lernen, sich selbst vor Hackern zu schützen.",
          "Das Design des Systems soll möglichst ansprechend aussehen.",
          "Die Nutzung des Systems ist nur für Sicherheitsexperten erlaubt."
        ],
        correctAnswer: 0,
        explanation: "Analog zu Privacy by Design bedeutet Security by Design, dass Sicherheitsaspekte als integraler Bestandteil während des gesamten Entwicklungszyklus berücksichtigt und eingebaut werden."
      },
      {
        text: "Welche Aussage über Open-Source-LLMs ist korrekt?",
        options: [
          "Sie bieten oft mehr Flexibilität und Anpassungsmöglichkeiten als proprietäre Modelle.",
          "Ihr Quellcode ist nicht öffentlich zugänglich.",
          "Sie sind immer kostenlos nutzbar, ohne jegliche Einschränkungen.",
          "Sie werden ausschließlich von großen Technologiekonzernen entwickelt."
        ],
        correctAnswer: 0,
        explanation: "Da der Code zugänglich ist, können Open-Source-LLMs von Unternehmen angepasst oder für spezifische Zwecke modifiziert werden, was bei geschlossenen Modellen meist nicht möglich ist."
      },
      {
        text: "In der Analogie \"Modell = Motor, Tool = Auto\": Was wäre ein \"Super-Agent\"?",
        options: [
          "Ein intelligenter Fahrer, der verschiedene Autos (Tools) koordiniert, um eine komplexe Aufgabe zu lösen.",
          "Ein besonders leistungsstarker Motor (Modell).",
          "Ein Auto mit vielen verschiedenen Motoren.",
          "Ein sehr einfacher Werkzeugkasten (Tool)."
        ],
        correctAnswer: 0,
        explanation: "Ein Super-Agent ist ein übergeordnetes System, das verschiedene spezialisierte Tools orchestriert, um einen komplexen Workflow abzuarbeiten."
      }
    ],
    videos: [
      "Einführung in die Grundlagen der KI - Momo",
      "KI Ethik - Zoltan",
      "Der AI Act - Elisabeth"
    ]
  },
  {
    title: "Modul 2 – Rechtliche Grundlagen",
    questions: [
      {
        text: "Was ist der primäre Regulierungsansatz des EU AI Acts?",
        options: [
          "Ein Verbot jeglicher KI-Nutzung in der EU.",
          "Ein technologieneutraler, risikobasierter Ansatz.",
          "Eine reine Selbstverpflichtung für Unternehmen.",
          "Eine Steuer auf KI-generierte Umsätze."
        ],
        correctAnswer: 1,
        explanation: "Der AI Act klassifiziert KI-Systeme nach ihrem potenziellen Risiko und knüpft daran unterschiedliche Pflichten, anstatt spezifische Technologien zu regulieren."
      },
      {
        text: "Welche Risikokategorie im AI Act ist mit den umfangreichsten Pflichten für Anbieter verbunden?",
        options: [
          "Minimales Risiko.",
          "Begrenztes Risiko (Transparenzpflichten).",
          "Hochrisiko (High-Risk).",
          "Verbotene Praktiken."
        ],
        correctAnswer: 2,
        explanation: "Anbieter von Hochrisiko-KI-Systemen müssen strenge Anforderungen erfüllen, u.a. bezüglich Risikomanagement, Datenqualität, Dokumentation und menschlicher Aufsicht."
      },
      {
        text: "Welche der folgenden KI-Anwendungen fällt laut AI Act (Art. 5) unter die verbotenen Praktiken?",
        options: [
          "Ein Chatbot im Kundenservice.",
          "Ein KI-System zur Qualitätskontrolle in der Produktion.",
          "Ein System, das unterschwellig Techniken einsetzt, um das Verhalten einer Person zu beeinflussen und sie zu Schaden zu bringen.",
          "Ein KI-basiertes System zur Optimierung von Lieferketten."
        ],
        correctAnswer: 2,
        explanation: "Artikel 5 verbietet explizit KI-Systeme, die manipulative oder ausnutzende Techniken verwenden, um das Verhalten wesentlich zu verzerren und wahrscheinlich Schaden zu verursachen."
      },
      {
        text: "Was ist KEINE der Hauptanforderungen an Anbieter von Hochrisiko-KI-Systemen gemäß AI Act?",
        options: [
          "Einrichtung eines Risikomanagementsystems.",
          "Verwendung ausschließlich von Open-Source-Softwarekomponenten.",
          "Sicherstellung hoher Datenqualität und Data Governance.",
          "Implementierung von menschlicher Aufsicht."
        ],
        correctAnswer: 1,
        explanation: "Der AI Act schreibt nicht vor, welche Art von Softwarekomponenten (Open Source oder proprietär) verwendet werden müssen, sondern stellt Anforderungen an das Gesamtsystem."
      },
      {
        text: "Ein KMU nutzt eine Standard-Software zur Personaleinsatzplanung. Wann könnte dieses System als Hochrisiko eingestuft werden?",
        options: [
          "Wenn die Software teuer war.",
          "Wenn sie Cloud-basiert ist.",
          "Wenn sie unter den Bereich \"Beschäftigung, Personalmanagement\" in Anhang III fällt UND erhebliche Auswirkungen auf Karriere oder Arbeitsbedingungen hat.",
          "Wenn sie von einem amerikanischen Unternehmen stammt."
        ],
        correctAnswer: 2,
        explanation: "Die Einstufung als Hochrisiko hängt davon ab, ob die Anwendung in einem der in Anhang III genannten Bereiche liegt und potenziell signifikante Auswirkungen hat."
      },
      {
        text: "Welche Pflicht trifft typischerweise den Nutzer (Deployer) eines Hochrisiko-KI-Systems?",
        options: [
          "Das System selbst neu zu zertifizieren.",
          "Eine eigene technische Dokumentation von Grund auf neu zu erstellen.",
          "Das System gemäß der Gebrauchsanweisung des Anbieters zu verwenden und den Betrieb zu überwachen.",
          "Das System muss zwingend auf eigener Hardware betrieben werden."
        ],
        correctAnswer: 2,
        explanation: "Nutzer von Hochrisiko-Systemen müssen u.a. die bestimmungsgemäße Verwendung sicherstellen und die menschliche Aufsicht sowie das Monitoring durchführen."
      },
      {
        text: "Wozu dient die technische Dokumentation eines Hochrisiko-KI-Systems primär?",
        options: [
          "Als Werbematerial für das Produkt.",
          "Als Nachweis gegenüber den Marktüberwachungsbehörden, dass das System die Anforderungen des AI Acts erfüllt.",
          "Als Schulungsunterlage für Endanwender.",
          "Als Basis für die Preisgestaltung des Systems."
        ],
        correctAnswer: 1,
        explanation: "Die technische Dokumentation ist das zentrale Element, um die Konformität des Systems mit den gesetzlichen Anforderungen zu belegen."
      },
      {
        text: "Ein KI-System analysiert Bewerbungsunterlagen. Warum ist hier das Thema Datenqualität (Data Governance) besonders kritisch?",
        options: [
          "Weil die Bewerber sonst zu lange auf eine Antwort warten müssen.",
          "Weil unausgewogene oder fehlerhafte Trainingsdaten zu diskriminierenden Empfehlungen führen können (Bias).",
          "Weil die KI sonst zu viele Rechtschreibfehler macht.",
          "Weil die Speicherung der Daten sehr teuer ist."
        ],
        correctAnswer: 1,
        explanation: "Im HR-Bereich ist das Risiko hoch, dass historische Voreingenommenheit in den Daten von der KI gelernt und reproduziert wird, was zu unfairer Diskriminierung führen kann."
      },
      {
        text: "Was bedeutet „Post-Market Monitoring\" für Anbieter von Hochrisiko-KI-Systemen?",
        options: [
          "Das Marketing für das Produkt nach dem Verkauf einzustellen.",
          "Die Leistung und Sicherheit des Systems auch nach dem Inverkehrbringen aktiv zu überwachen und bei Bedarf Korrekturmaßnahmen zu ergreifen.",
          "Den Preis des Systems nach Markteinführung zu beobachten.",
          "Nur noch positives Kundenfeedback zu sammeln."
        ],
        correctAnswer: 1,
        explanation: "Der Anbieter muss einen Prozess etablieren, um Daten aus der realen Nutzung zu sammeln, das System auf neue Risiken zu überprüfen und gegebenenfalls Updates oder Rückrufe zu veranlassen."
      },
      {
        text: "Der AI Act ist eine EU-Verordnung. Was bedeutet das für die Mitgliedstaaten wie Deutschland?",
        options: [
          "Deutschland muss den AI Act erst noch in ein eigenes nationales Gesetz umwandeln.",
          "Die Verordnung gilt unmittelbar in Deutschland und hat Vorrang vor entgegenstehendem nationalem Recht.",
          "Jedes Bundesland kann eigene, abweichende KI-Regeln erlassen.",
          "Die Verordnung ist nur eine unverbindliche Empfehlung für deutsche Unternehmen."
        ],
        correctAnswer: 1,
        explanation: "EU-Verordnungen gelten unmittelbar in jedem Mitgliedstaat und bedürfen keiner Umsetzung in nationales Recht."
      },
      {
        text: "Welches Ziel verfolgt der AI Act NICHT primär?",
        options: [
          "Den Schutz von Grundrechten und Sicherheit der EU-Bürger.",
          "Die Förderung von Innovation und der Akzeptanz von KI in der EU.",
          "Die Schaffung eines einheitlichen Binnenmarktes für KI-Systeme.",
          "Die Festlegung von Standards für die Energieeffizienz von KI-Algorithmen."
        ],
        correctAnswer: 3,
        explanation: "Obwohl Nachhaltigkeit erwähnt wird, liegt der Hauptfokus des AI Acts auf Sicherheit, Grundrechten und Marktregulierung, nicht auf spezifischen Energieeffizienz-Standards."
      },
      {
        text: "Die Geltung der Regeln des AI Acts beginnt gestaffelt. Welche Regeln werden voraussichtlich zuerst wirksam?",
        options: [
          "Die Pflichten für Hochrisiko-Systeme.",
          "Die Transparenzpflichten für Chatbots und Deepfakes.",
          "Die Verbote für bestimmte KI-Praktiken (Art. 5).",
          "Die Regeln für GPAI-Modelle mit systemischem Risiko."
        ],
        correctAnswer: 2,
        explanation: "Laut Zeitplan treten die Verbote nach Artikel 5 bereits 6 Monate nach Inkrafttreten der Verordnung in Kraft, da diese Praktiken als besonders schädlich angesehen werden."
      }
    ],
    videos: [
      "KI-Psychologie und Vertrauensaufbau",
      "Prompt Engineering und Datenschutz-Compliance",
      "Umsetzung des EU AI Acts in D-A-CH"
    ]
  },
  {
    title: "Modul 3 – Ethik & Kommunikation",
    questions: [
      {
        text: "Was ist der Hauptunterschied zwischen deontologischer und utilitaristischer Ethik?",
        options: [
          "Deontologie fokussiert auf Regeln und Pflichten, Utilitarismus auf die Folgen einer Handlung.",
          "Deontologie ist nur für Unternehmen relevant, Utilitarismus nur für Privatpersonen.",
          "Deontologie stammt aus Asien, Utilitarismus aus Europa.",
          "Deontologie bewertet Emotionen, Utilitarismus nur Fakten."
        ],
        correctAnswer: 0,
        explanation: "Die Deontologie beurteilt eine Handlung anhand ihrer Übereinstimmung mit moralischen Regeln, während der Utilitarismus sie anhand ihrer Konsequenzen und des Gesamtnutzens bewertet."
      },
      {
        text: "Welches der folgenden Prinzipien gehört NICHT zu den 7 Schlüsselanforderungen der EU für vertrauenswürdige KI?",
        options: [
          "Transparenz.",
          "Maximierung des Unternehmensgewinns.",
          "Technische Robustheit und Sicherheit.",
          "Vielfalt, Nichtdiskriminierung und Fairness."
        ],
        correctAnswer: 1,
        explanation: "Die EU-Ethik-Leitlinien fokussieren auf Grundrechte und gesellschaftliches Wohl. Gewinnmaximierung ist ein Unternehmensziel, aber kein ethisches Prinzip im Sinne dieser Leitlinien."
      },
      {
        text: "Was ist der Zweck eines „KI-Logbuchs\" im Sinne der Transparenz im KMU?",
        options: [
          "Die Arbeitszeiten der KI-Entwickler zu erfassen.",
          "Die Kosten für den Einsatz von KI-Systemen zu dokumentieren.",
          "Wichtige KI-gestützte Entscheidungen und deren Grundlagen nachvollziehbar zu machen.",
          "Die Lieblings-KI-Tools der Mitarbeiter aufzulisten."
        ],
        correctAnswer: 2,
        explanation: "Ein KI-Logbuch dient dazu, transparent zu machen, wie KI-Systeme für relevante Entscheidungen eingesetzt wurden, um Accountability und Fehlersuche zu unterstützen."
      },
      {
        text: "Warum ist ein „Daten-Check\" auf Fairness wichtig, bevor KI auf Unternehmensdaten angewendet wird?",
        options: [
          "Um sicherzustellen, dass genügend Speicherplatz vorhanden ist.",
          "Um zu verhindern, dass die KI historische Ungleichgewichte oder Bias in den Daten lernt und verstärkt.",
          "Um die Daten auf Viren zu überprüfen.",
          "Um die Daten für die KI besser lesbar zu machen."
        ],
        correctAnswer: 1,
        explanation: "Ein aktiver Daten-Check hilft, das Risiko zu erkennen und gegenzusteuern, dass eine KI auf Basis von verzerrten Daten diskriminierende Entscheidungen trifft."
      },
      {
        text: "Was versteht man unter \"Audience Mapping\" in der internen Kommunikation über KI?",
        options: [
          "Eine Landkarte, die zeigt, wo die KI-Server stehen.",
          "Die Analyse, welche Mitarbeiter am meisten über KI wissen.",
          "Die Identifikation verschiedener interner Zielgruppen und die Anpassung der Kommunikationsbotschaften an deren Bedürfnisse und Wissensstand.",
          "Eine Software zur automatischen Verteilung von Nachrichten im Unternehmen."
        ],
        correctAnswer: 2,
        explanation: "Audience Mapping bedeutet, die interne \"Landschaft\" der Adressaten zu verstehen und die Kommunikation spezifisch auf jede Gruppe zuzuschneiden, um maximale Akzeptanz zu erreichen."
      },
      {
        text: "Welche Frage sollte ein gutes externes FAQ zum Thema KI für Kunden NICHT unbeantwortet lassen?",
        options: [
          "Welchen Browser benutzt der CEO?",
          "Wie stellt das Unternehmen den Datenschutz beim KI-Einsatz sicher?",
          "Was hat der Programmierer der KI gestern zu Mittag gegessen?",
          "Welches ist das Lieblings-Fußballteam des Marketingleiters?"
        ],
        correctAnswer: 1,
        explanation: "Datenschutz ist eine Kernsorge von Kunden. Ein externes FAQ sollte proaktiv und transparent erklären, welche Maßnahmen zum Schutz personenbezogener Daten ergriffen werden."
      },
      {
        text: "Was ist das Kernprinzip von \"Strategic Empathy\" in der Kommunikation (z.B. über den AI Act)?",
        options: [
          "Möglichst viele Fachbegriffe zu verwenden, um Kompetenz zu zeigen.",
          "Sich in die Perspektive und Gefühlslage des Gegenübers hineinzuversetzen und die Kommunikation darauf abzustimmen.",
          "Die eigene Meinung klar und unmissverständlich durchzusetzen.",
          "Dem Gegenüber immer zuzustimmen, auch wenn man anderer Meinung ist."
        ],
        correctAnswer: 1,
        explanation: "Strategic Empathy bedeutet, die Welt aus den Augen des anderen zu sehen (seine Sorgen, sein Wissen) und die eigene Botschaft so zu gestalten, dass sie verstanden wird und eine Verbindung herstellt."
      },
      {
        text: "Welches \"Don't\" gilt für die Kommunikation über KI in Social Media?",
        options: [
          "Unrealistische Versprechungen über die Fähigkeiten der KI machen (\"KI löst alle Probleme\").",
          "Den Nutzen der KI für Kunden erklären.",
          "Auf kritische Fragen und Kommentare eingehen.",
          "Auf weiterführende Informationen (z.B. FAQ) verlinken."
        ],
        correctAnswer: 0,
        explanation: "Übertriebene oder falsche Versprechungen untergraben die Glaubwürdigkeit und führen zu Enttäuschungen. Eine realistische Darstellung ist entscheidend für nachhaltiges Vertrauen."
      },
      {
        text: "Eine Mitarbeiterin äußert Angst, dass KI ihren Job überflüssig macht. Welche Reaktion zeigt am wenigsten Strategic Empathy?",
        options: [
          "\"Da müssen Sie keine Angst haben, das ist Unsinn.\"",
          "\"Ich verstehe, dass neue Technologien Sorgen auslösen können. Lassen Sie uns darüber sprechen, wie KI Sie konkret unterstützen kann.\"",
          "\"Diese Sorge höre ich öfter. Es ist wichtig, dass wir offen darüber reden, wie sich Aufgaben verändern und welche neuen Chancen entstehen.\"",
          "\"Es stimmt, dass sich durch KI Aufgaben verändern werden. Deshalb investieren wir in Schulungen, damit Sie die neuen Werkzeuge nutzen lernen.\""
        ],
        correctAnswer: 0,
        explanation: "Diese Antwort weist die Sorge direkt zurück und nimmt die Emotion der Mitarbeiterin nicht ernst. Sie blockiert den Dialog, anstatt ihn zu öffnen."
      },
      {
        text: "Was bedeutet \"Accountability\" (Rechenschaftspflicht) im Kontext von KI-Ethik?",
        options: [
          "Dass die KI selbst für ihre Fehler verantwortlich ist.",
          "Dass es klare Verantwortlichkeiten und Mechanismen gibt, um sicherzustellen, dass KI-Systeme und deren Entscheidungen überprüft und gerechtfertigt werden können.",
          "Dass alle KI-Systeme Open Source sein müssen.",
          "Dass nur promovierte Informatiker KI entwickeln dürfen."
        ],
        correctAnswer: 1,
        explanation: "Accountability bedeutet, dass es definierte Personen oder Prozesse gibt, die für den Entwurf, den Einsatz und die Auswirkungen von KI-Systemen verantwortlich sind und darüber Rechenschaft ablegen können."
      },
      {
        text: "Welches Element sollte eine gute interne E-Mail zur Ankündigung neuer KI-Richtlinien enthalten?",
        options: [
          "Eine möglichst lange Liste aller Paragrafen des AI Acts.",
          "Vage Formulierungen, um niemanden zu beunruhigen.",
          "Eine Aufforderung an die Mitarbeiter, die Richtlinien selbst im Internet zu suchen.",
          "Eine klare Begründung (Warum?), eine Zusammenfassung der wichtigsten Regeln und ein Hinweis auf weitere Informationen/Ansprechpartner."
        ],
        correctAnswer: 3,
        explanation: "Eine effektive Ankündigungsmail sollte den Kontext liefern (Warum?), die Kernpunkte verständlich machen (Was?), den Nutzen aufzeigen und klare nächste Schritte nennen (Wie weiter?)."
      },
      {
        text: "Warum ist die Verknüpfung von Ethik und Recht (AI Act) beim KI-Einsatz so wichtig für KMUs?",
        options: [
          "Weil ethisches Handeln oft gesetzliche Anforderungen vorwegnimmt oder ergänzt und Vertrauen schafft, was ein Wettbewerbsvorteil ist.",
          "Weil der AI Act alle ethischen Fragen abschließend klärt.",
          "Weil Ethik immer teurer ist als nur die Einhaltung des Gesetzes.",
          "Weil Ethik nur für große Konzerne eine Rolle spielt."
        ],
        correctAnswer: 0,
        explanation: "Ethische Prinzipien finden sich oft in rechtlichen Anforderungen wieder. Ein nachweislich ethischer Umgang mit KI schafft Vertrauen bei Kunden und Mitarbeitern, was über die reine Compliance hinausgeht."
      }
    ],
    videos: [
      "KI-Kommunikation und Vertrauensaufbau",
      "KI-Agenten und Automatisierung",
      "Rechtliche Umsetzung des EU AI Acts"
    ]
  }
];

export const legacyExamSections: ExamSection[] = rawExamSections.map(
  (section, sectionIndex) => ({
    ...section,
    id: `legacy-section-${sectionIndex + 1}`,
    questions: section.questions.map((question, questionIndex) => ({
      ...question,
      id: `${slugify(section.title)}-${questionIndex + 1}`,
    })),
  }),
);

export const LEGACY_EXAM_DEFINITION: ExamDefinition = {
  id: 'legacy-euki-exam',
  version: 'legacy-v1',
  title: 'EU AI Act Kompetenzprüfung',
  passThreshold: 70,
  questionTimeLimitSeconds: 120,
  sections: legacyExamSections,
};
