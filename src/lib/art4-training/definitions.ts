/**
 * KI-Kompetenz nach Art. 4 EU AI Act — kostenlose Rollenschulungen.
 *
 * Hinweis: Die Inhalte sind fachlich redaktionell kuratiert. In der
 * Produktion wurden KI-gestützte Werkzeuge unterstützend eingesetzt.
 *
 * Die korrekten Quiz-Antworten liegen bewusst NICHT in dieser Datei
 * (Client-Bundle), sondern server-seitig in ./answers.ts.
 */

export const ART4_PROGRAM_SLUG = 'ki-kompetenz';
export const ART4_EXAM_VERSION = 'art4-rollen-v1';
export const ART4_PASS_THRESHOLD = 6;
export const ART4_VALIDITY_MONTHS = 24;

export interface Art4QuizQuestion {
  question: string;
  options: string[];
}

export interface Art4ModuleDefinition {
  slug: string;
  role: string;
  title: string;
  duration: string;
  summary: string;
  videoUrl: string;
  certificateModuleLabel: string;
  quiz: Art4QuizQuestion[];
}

export const ART4_MODULES: Art4ModuleDefinition[] = [
  {
    slug: 'geschaeftsfuehrung',
    role: 'Geschäftsführung',
    title: 'KI-Kompetenz für die Geschäftsführung',
    duration: 'ca. 8 Minuten Video + Lernkontrolle',
    summary:
      'Verantwortung und Haftung der Leitung, der Art.-4-Nachweis als Kette statt Kursliste, und die drei Entscheidungen dieser Woche.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/ai-act-compass-m6o05.firebasestorage.app/o/schulungen%2Fart4%2Fkikompetenz-art4-a-geschaeftsfuehrung.mp4?alt=media&token=4fe5f251-5b16-409d-80cc-1344daedb009',
    certificateModuleLabel:
      'KI-Kompetenz nach Art. 4 EU AI Act — Rolle: Geschäftsführung',
    quiz: [
      {
        question:
          'Seit wann gilt die Pflicht zur KI-Kompetenz nach Art. 4 EU AI Act?',
        options: [
          'Ab 2027',
          'Seit dem 2. Februar 2025',
          'Erst nach nationaler Umsetzung',
          'Nur für Hochrisiko-Anbieter',
        ],
      },
      {
        question:
          'Was genügt laut EU-Q&A am ehesten als Nachweis nach Art. 4?',
        options: [
          'Eine Kursliste',
          'Eine Selbstverpflichtung',
          'Eine Kette aus Einsatzfall, Rolle, Risiko und Maßnahmen',
          'Ein externes Gutachten',
        ],
      },
      {
        question:
          'Ihr Unternehmen nutzt ein zugekauftes KI-Tool im Vertrieb. Ihre Rolle nach der Verordnung ist in der Regel:',
        options: ['Betreiber', 'Anbieter', 'Einführer', 'Keine'],
      },
      {
        question:
          'Ein Recruiting-Tool bewertet Bewerbungen per KI-Ranking. Das ist typischerweise:',
        options: [
          'Minimales Risiko',
          'Begrenztes Risiko',
          'Hochrisiko',
          'Verboten',
        ],
      },
      {
        question: 'Die wichtigste Führungsregel im KI-Einsatz lautet:',
        options: [
          'KI entscheidet, der Mensch kontrolliert stichprobenartig',
          'KI bereitet vor, Menschen entscheiden',
          'KI nur nach Betriebsratsfreigabe',
          'KI nur offline einsetzen',
        ],
      },
      {
        question: 'Warum ist ein KI-Totalverbot riskant?',
        options: [
          'Es ist wettbewerbswidrig',
          'Es erzeugt Schatten-Nutzung ohne Übersicht',
          'Es verstößt gegen Art. 4',
          'Es ist kündigungsrelevant',
        ],
      },
      {
        question:
          'Der allgemeine Bußgeldrahmen der KI-Verordnung reicht bis:',
        options: [
          '100.000 €',
          '2 % vom Gewinn',
          '35 Mio. € oder 7 % des weltweiten Jahresumsatzes',
          'Unbegrenzt',
        ],
      },
      {
        question:
          'Welche drei Sofortmaßnahmen empfiehlt dieses Modul der Leitung?',
        options: [
          'Register anlegen, Verantwortliche benennen, Schulung und Weisung anordnen',
          'Anwalt beauftragen, Audit kaufen, Versicherung abschließen',
          'KI-Stopp, Analyse, Neustart',
          'Zertifizierung nach ISO 9001',
        ],
      },
    ],
  },
  {
    slug: 'hr',
    role: 'HR & Personal',
    title: 'KI-Kompetenz für HR & Personal',
    duration: 'ca. 7 Minuten Video + Lernkontrolle',
    summary:
      'Recruiting-KI als Hochrisiko, Umgang mit Mitarbeiterdaten und HR als Organisatorin der rollenbezogenen Kompetenznachweise.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/ai-act-compass-m6o05.firebasestorage.app/o/schulungen%2Fart4%2Fkikompetenz-art4-b-hr.mp4?alt=media&token=d8ff95f2-84a6-487f-800b-ca3675a645da',
    certificateModuleLabel:
      'KI-Kompetenz nach Art. 4 EU AI Act — Rolle: HR & Personal',
    quiz: [
      {
        question:
          'Ein KI-gestütztes Bewerber-Ranking in Ihrer HR-Software ist typischerweise:',
        options: [
          'Minimales Risiko',
          'Hochrisiko nach Anhang III',
          'Verboten',
          'Nur ein DSGVO-Thema',
        ],
      },
      {
        question:
          'Ein KI-Score sortiert einen Bewerber aus, niemand prüft das. Das ist problematisch, weil:',
        options: [
          'Die menschliche Entscheidung nicht echt und nachvollziehbar ist',
          'Der Score zu niedrig war',
          'KI im Recruiting verboten ist',
          'Nur der Betriebsrat entscheiden darf',
        ],
      },
      {
        question:
          'Welche Daten dürfen in ein frei zugängliches KI-Tool eingegeben werden?',
        options: [
          'Anonymisierte Zeugnisentwürfe nach sorgfältiger Prüfung',
          'Klarname plus Diagnose',
          'Die Gehaltsliste',
          'Eine Beurteilung mit Namen',
        ],
      },
      {
        question:
          'Was erwartet die EU-Kommission beim Art.-4-Nachweis besonders?',
        options: [
          'Eine Mindeststundenzahl',
          'Rollen- und Einsatzfallbezug der Maßnahmen',
          'Eine externe Zertifizierungsstelle',
          'Jährliche Prüfung durch die Behörde',
        ],
      },
      {
        question: 'Wo gehören Schulungszertifikate idealerweise hin?',
        options: [
          'In die Personalakte — das reicht',
          'Als Evidenz an den KI-Einsatzfall im Register',
          'Zum Anbieter',
          'Ins E-Mail-Postfach',
        ],
      },
      {
        question: 'Der Begriff „Halluzination" bezeichnet:',
        options: [
          'Erfundene Inhalte in überzeugender Form',
          'Einen Rechenfehler',
          'Eine Bildstörung',
          'Ein Datenleck',
        ],
      },
      {
        question:
          'Der natürliche Ankerpunkt für dauerhafte KI-Schulung ist:',
        options: [
          'Die Weihnachtsfeier',
          'Das Kündigungsgespräch',
          'Onboarding plus jährliche Auffrischung',
          'Die Betriebsversammlung',
        ],
      },
      {
        question:
          'Ihr Recruiting-Anbieter sagt: „Unser Tool ist compliant." Was gilt?',
        options: [
          'Damit sind Sie entlastet',
          'Ihre Betreiberpflichten (Aufsicht, Doku, Register) bleiben bestehen',
          'Nur der Anbieter haftet',
          'Das Tool ist dann kein Hochrisiko mehr',
        ],
      },
    ],
  },
  {
    slug: 'sachbearbeitung',
    role: 'Sachbearbeitung & Fachbereiche',
    title: 'KI sicher nutzen im Arbeitsalltag',
    duration: 'ca. 6 Minuten Video + Lernkontrolle',
    summary:
      'Die fünf Alltagsregeln: Daten schützen, prüfen vor verwenden, Transparenz wahren, neue Tools in 30 Sekunden melden.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/ai-act-compass-m6o05.firebasestorage.app/o/schulungen%2Fart4%2Fkikompetenz-art4-c-sachbearbeitung.mp4?alt=media&token=61bbae4b-7460-46dc-a22c-c86d8f11e5ad',
    certificateModuleLabel:
      'KI-Kompetenz nach Art. 4 EU AI Act — Rolle: Sachbearbeitung & Fachbereiche',
    quiz: [
      {
        question:
          'Warum können KI-Texte falsch sein, obwohl sie perfekt klingen?',
        options: [
          'Sprachmodelle erzeugen wahrscheinliche, nicht geprüfte Inhalte',
          'Wegen schlechter Übersetzung',
          'Wegen zu wenig Speicher',
          'Wegen Zensur',
        ],
      },
      {
        question:
          'Ein Kunde soll per KI-formulierter E-Mail eine Absage bekommen. Was gilt für seine Daten?',
        options: [
          'Name ist okay, Adresse nicht',
          'Nur in ein freigegebenes Tool — oder anonymisieren',
          'Alles erlaubt, wenn danach gelöscht wird',
          'Nur mit Einwilligung des Kunden',
        ],
      },
      {
        question:
          'Die KI liefert eine Statistik für Ihr Angebot. Was tun Sie vor dem Versand?',
        options: [
          'Übernehmen — die KI ist aktuell',
          'Gegen eine verlässliche Quelle prüfen',
          'Im Konjunktiv formulieren',
          'Einen Disclaimer anhängen',
        ],
      },
      {
        question:
          'Sie entdecken ein praktisches neues KI-Tool. Ihr erster Schritt:',
        options: [
          'Einfach nutzen — Ergebnisse zählen',
          'Privat mit Firmendaten testen',
          'In 30 Sekunden per Quick Capture ins Register melden',
          'IT-Ticket mit drei Wochen Vorlauf',
        ],
      },
      {
        question:
          'Sie entdecken eine falsche KI-Zahl in einem bereits verschickten Angebot:',
        options: [
          'Sofort melden, korrigieren, kurz dokumentieren',
          'Abwarten, ob es auffällt',
          'Still korrigieren',
          'Den KI-Anbieter verantwortlich machen',
        ],
      },
      {
        question: 'Wofür ist KI im Arbeitsalltag am stärksten?',
        options: [
          'Verbindliche Rechtsauskünfte',
          'Entwürfe, Zusammenfassungen, Struktur',
          'Personalentscheidungen',
          'Fakten-Recherche ohne Prüfung',
        ],
      },
      {
        question:
          'Ihr Team setzt einen Chatbot Richtung Kunden ein. Was verlangt die Verordnung?',
        options: [
          'Nichts Besonderes',
          'Erkennbarkeit als KI plus einen Weg zu einem Menschen',
          'Abschaltung in der Nacht',
          'Anwaltliche Freigabe jeder Antwort',
        ],
      },
      {
        question:
          'Wer trägt die Endverantwortung für ein KI-gestütztes Arbeitsergebnis?',
        options: [
          'Der KI-Anbieter',
          'Die IT',
          'Die Person, die es verwendet',
          'Niemand',
        ],
      },
    ],
  },
  {
    slug: 'it',
    role: 'IT',
    title: 'KI-Kompetenz für die IT',
    duration: 'ca. 8 Minuten Video + Lernkontrolle',
    summary:
      'Inventar als Nachweis-Grundlage, Shadow AI, KI-Fragen in der Beschaffung, die Anbieter-Falle und saubere Arbeitsteilung mit der Governance.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/ai-act-compass-m6o05.firebasestorage.app/o/schulungen%2Fart4%2Fkikompetenz-art4-d-it.mp4?alt=media&token=0320ff23-1ea6-4583-ad3a-ed83b5e58f34',
    certificateModuleLabel: 'KI-Kompetenz nach Art. 4 EU AI Act — Rolle: IT',
    quiz: [
      {
        question:
          'Der erste Baustein eines Art.-4-Programms laut EU-Q&A ist:',
        options: [
          'Ein Inventar der eingesetzten KI',
          'Eine externe Auditfirma',
          'Eine Ethik-Charta',
          'Die Kündigung riskanter Tools',
        ],
      },
      {
        question: 'Die wirksamste Antwort auf Shadow AI ist:',
        options: [
          'Alle KI-Domains sperren',
          'Freigegebene Alternativen plus ein 30-Sekunden-Meldeweg',
          'Abmahnungen',
          'Ein BYOD-Verbot',
        ],
      },
      {
        question:
          'Sie bauen ein Sprachmodell per API in Ihr Kundenprodukt ein. Welches Risiko besteht?',
        options: [
          'Keins — das Modell ist zugekauft',
          'Ihr Unternehmen kann Anbieter mit erweiterten Pflichten werden',
          'Nur ein DSGVO-Risiko',
          'Nur bei Open-Source-Modellen relevant',
        ],
      },
      {
        question:
          'Ein Fachbereich will KI-gestütztes Bewerber-Screening einführen. Die IT sollte:',
        options: [
          'Einfach ausrollen',
          'Vor Einführung Registereintrag, Risikoeinstufung und menschliche Aufsicht sicherstellen',
          'Ablehnen — Hochrisiko ist verboten',
          'An den Anbieter verweisen',
        ],
      },
      {
        question:
          'Welche Frage gehört NICHT zwingend in die KI-Beschaffungsprüfung?',
        options: [
          'Trainiert der Anbieter mit unseren Daten?',
          'Gibt es einen Auftragsverarbeitungsvertrag?',
          'Welche Aufsichts-Features gibt es?',
          'In welchem Land sitzt der CEO des Anbieters?',
        ],
      },
      {
        question:
          'Die finale Risikoeinstufung eines Einsatzfalls trifft:',
        options: [
          'Die IT allein',
          'Der Anbieter',
          'Governance/Leitung auf Basis der IT-Fakten, mit menschlicher Bestätigung',
          'Die Aufsichtsbehörde vorab',
        ],
      },
      {
        question:
          'Ein KI-Feature taucht per Update in Bestandssoftware auf. Korrekt ist:',
        options: [
          'Als (geänderten) Einsatzfall ins Register aufnehmen und einstufen',
          'Ignorieren — Bestandsschutz',
          'Die Software deinstallieren',
          'Nur den Anbieter informieren',
        ],
      },
      {
        question: 'Wozu dienen Betriebsregeln im Use Case Pass?',
        options: [
          'Marketing',
          'Nachvollziehbare Aufsicht, Logging- und Eingabegrenzen pro Einsatzfall — auch als Übergabewissen',
          'Als Ersatz für den AVV',
          'Als SLA mit dem Anbieter',
        ],
      },
    ],
  },
];

export function getArt4Module(slug: string): Art4ModuleDefinition | null {
  return ART4_MODULES.find((module) => module.slug === slug) ?? null;
}
