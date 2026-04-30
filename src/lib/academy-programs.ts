export type AcademyProgramSlug = 'grundkurs' | 'juristen';

export interface AcademyProgramResource {
  label: string;
  href: string;
  format: 'PDF' | 'XLSX' | 'Seite';
  description: string;
}

export interface AcademyProgramLesson {
  id: string;
  slug: string;
  title: string;
  presenter: string;
  duration: string;
  summary: string;
  transcriptHighlights: string[];
  embedUrl: string;
  resources: AcademyProgramResource[];
}

export interface AcademyProgramDefinition {
  slug: AcademyProgramSlug;
  title: string;
  strapline: string;
  summary: string;
  targetAudience: string[];
  delivers: string[];
  accessNote: string;
  lessons: AcademyProgramLesson[];
}

export const academyProgramDefinitions: AcademyProgramDefinition[] = [
  {
    slug: 'grundkurs',
    title: 'KI Governance Grundkurs',
    strapline: 'Allgemeiner Academy-Track',
    summary:
      'Dieser Track verbindet KI-Einführung, Registerlogik, Use-Case-Pass und operative Nachweisführung. Er richtet sich an Personen, die KI-Nutzung erklären, strukturiert dokumentieren und im Unternehmen verankern wollen.',
    targetAudience: [
      'Führungskräfte und Projektverantwortliche, die KI-Nutzung organisatorisch absichern wollen',
      'AI-Berater, Coaches und interne Enabler mit Fokus auf Einführung und Rollout',
      'Governance-, Compliance- und Operations-Teams, die ein belastbares Arbeitsobjekt brauchen',
    ],
    delivers: [
      'vier kuratierte Lernschritte direkt in der Academy',
      'Begleittexte aus den vorhandenen Schulungsskripten und direkte Handouts im Kurskontext',
      'einen klaren Übergang vom allgemeinen KI-Einstieg zur realen Register- und Nachweisarbeit',
    ],
    accessNote:
      'Die Zusatzprogramme liegen bewusst in der bezahlten Academy. Für Einzelpersonen können Promotion-Codes im bestehenden Stripe-Checkout genutzt werden, auch für eine vollständige Freischaltung ohne reguläre Zahlung.',
    lessons: [
      {
        id: 'grundkurs-1',
        slug: 'das-fehlende-bindeglied',
        title: 'Das fehlende Bindeglied',
        presenter: 'Momo Feichtinger',
        duration: 'ca. 10 Minuten',
        summary:
          'Warum KI-Einführung ohne Governance-Spur unvollständig bleibt und weshalb Unternehmen heute ein nachweisbares Organisationsobjekt statt bloßer Tool-Listen brauchen.',
        transcriptHighlights: [
          'Der Kurs eröffnet mit der praktischen Lücke zwischen erfolgreichen KI-Workshops und der späteren Frage, wie verantwortungsvolle Nutzung eigentlich nachgewiesen werden soll.',
          'Im Zentrum steht die These, dass der EU AI Act ein Organisationsgesetz ist und dass genau daraus ein neues Beratungs- und Umsetzungsfeld entsteht.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/fffcd0b5-b1fb-47dd-a30b-3d876d32d58d',
        resources: [
          {
            label: 'Handout: KI-Einführung zu Governance',
            href: '/resources/academy/general/C1_KI_Einfuehrung_zu_Governance.pdf',
            format: 'PDF',
            description:
              'Begleitendes Handout zur Übersetzung von KI-Einstieg, Shadow AI und Governance-Spur in einen belastbaren Organisationsansatz.',
          },
          {
            label: 'Update: AI Literacy im Betrieb',
            href: '/updates/ai-literacy-verantwortung-2026',
            format: 'Seite',
            description:
              'Vertiefende Einordnung dazu, wie Rollen, Schulung und reale Einsatzfälle organisatorisch zusammengeführt werden müssen.',
          },
        ],
      },
      {
        id: 'grundkurs-2',
        slug: 'das-register-als-deliverable',
        title: 'Das Register als Deliverable',
        presenter: 'Momo Feichtinger',
        duration: 'ca. 10 Minuten',
        summary:
          'Wie aus einem Workshop oder Beratungsprojekt ein tatsächliches Governance-Artefakt wird, das intern weiterlebt und extern vorzeigbar bleibt.',
        transcriptHighlights: [
          'Das Video zeigt, wie der Use-Case Pass als abschließendes Deliverable funktioniert und warum ein lebendiges Register stärker ist als ein bloßer Bericht oder Rollout-Plan.',
          'Besonders betont wird der Moment, in dem Use Cases live im Workshop erfasst werden und dadurch ein dauerhaft nutzbares Ergebnis für die Organisation entsteht.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/91add187-23c1-4171-8538-1db632c2ff5c',
        resources: [
          {
            label: 'Handout: Workshop-Integration Template',
            href: '/resources/academy/general/C2_Workshop_Integration_Template.pdf',
            format: 'PDF',
            description:
              'Konkretes Kurs-Handout für Moderation, Live-Erfassung und die Übergabe eines echten Register-Deliverables am Ende eines Workshops.',
          },
          {
            label: 'Practitioner Workshop Kit',
            href: '/resources/workbooks/ki-register-practitioner-workshop-kit.xlsx',
            format: 'XLSX',
            description:
              'Workbook für Canvas, Capture und Delivery-Checklist, damit die im Kurs gezeigte Logik direkt operationalisiert werden kann.',
          },
        ],
      },
      {
        id: 'grundkurs-3',
        slug: 'governance-als-wachstumsmotor',
        title: 'Governance als Wachstumsmotor',
        presenter: 'Momo Feichtinger & Zoltan Gal',
        duration: 'ca. 10 Minuten',
        summary:
          'Wie Governance aus bestehenden Kundenbeziehungen, Audit-Druck und Lieferkettenanfragen zu einem belastbaren Angebotsfeld wird.',
        transcriptHighlights: [
          'Das Modul übersetzt Governance in Positionierung, Mandatslogik und wiederkehrende Formate wie Inventur, Sprint und Quartalsbegleitung.',
          'Wichtig ist dabei die Abgrenzung zwischen Tool, Beratung und juristischer Prüfung, damit das Angebotsbild professionell und glaubwürdig bleibt.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/92b70126-67b7-4efc-8070-4623485686cf',
        resources: [
          {
            label: 'Handout: Angebotsformate und Reaktivierung',
            href: '/resources/academy/general/C3_Angebotsformate_Reaktivierung.pdf',
            format: 'PDF',
            description:
              'Kurs-Handout zu Angebotsformaten, Reaktivierung bestehender Beziehungen und zur Positionierung von Governance als Folgeangebot.',
          },
          {
            label: 'Practitioner Kit',
            href: '/artefacts/practitioner-kit',
            format: 'Seite',
            description:
              'Die passende Artefaktseite mit zusätzlichen Workbooks, Handouts und dem operationalen Delivery-Kontext für Partner.',
          },
        ],
      },
      {
        id: 'grundkurs-4',
        slug: 'use-case-pass-und-nachweisstruktur',
        title: 'Use-Case Pass und Nachweisstruktur',
        presenter: 'KIRegister',
        duration: 'ca. 10 Minuten',
        summary:
          'Vertiefung zur Frage, wie der einzelne Einsatzfall als Pass beschrieben, exportiert und in Verify- und Supplier-Kontexte überführt wird.',
        transcriptHighlights: [
          'Dieses Abschlussmodul bündelt die operative Pass-Logik: ein Einsatzfall, ein Owner, ein Review-Status und eine nachvollziehbare Evidenzkette.',
          'Damit wird aus allgemeiner KI-Schulung eine Struktur, die intern steuerbar und extern anschlussfähig bleibt.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/4eef4186-a6b0-4534-8621-49e81b9bba49',
        resources: [
          {
            label: 'Handout: Use-Case Pass Anatomie',
            href: '/resources/handouts/ki-register-handout-use-case-pass-anatomie.pdf',
            format: 'PDF',
            description:
              'Vertiefendes Handout zur Struktur des Passes, zur Statuslogik und zur rechtlichen Lesbarkeit eines einzelnen KI-Einsatzfalls.',
          },
          {
            label: 'Beispiel Use-Case Pass',
            href: '/resources/examples/ki-register-use-case-pass-beispiel.pdf',
            format: 'PDF',
            description:
              'Professionell ausgearbeiteter Referenzfall, der zeigt, wie ein vollständiger Pass im Ergebnis aussieht.',
          },
        ],
      },
    ],
  },
  {
    slug: 'juristen',
    title: 'KI Governance für Juristen und Kanzleien',
    strapline: 'Academy-Track für Rechtsanwälte',
    summary:
      'Dieser Track übersetzt KI-Governance in Kanzleipraxis, Haftung, Mandatsaufbau und Nachweisführung. Er zeigt, wie das KI Register im juristischen Alltag als Arbeitswerkzeug und Mandatserweiterung eingesetzt werden kann.',
    targetAudience: [
      'Rechtsanwälte und Kanzleien mit Mandanten im Mittelstand',
      'Juristische Teams mit Fragen zu Haftung, Lieferkette und Auditfähigkeit',
      'Compliance-nahe Berater, die juristische Arbeit mit strukturierten KI-Artefakten verbinden wollen',
    ],
    delivers: [
      'drei juristisch fokussierte Videomodule direkt in der Academy',
      'konkrete Handouts zu Haftungskette, Pass-Struktur und Mandatsreaktivierung',
      'eine saubere Brücke von juristischer Einordnung zur operativen Registerarbeit mit Mandanten',
    ],
    accessNote:
      'Auch dieser Track bleibt Teil der bezahlten Academy. Für Einzelpersonen oder gezielte Freischaltungen können im bestehenden Checkout Promotion-Codes hinterlegt und direkt eingelöst werden.',
    lessons: [
      {
        id: 'juristen-1',
        slug: 'das-neue-haftungsfeld',
        title: 'Das neue Haftungsfeld',
        presenter: 'Zoltan Gal',
        duration: 'ca. 10 Minuten',
        summary:
          'Warum der EU AI Act für Juristen vor allem als Organisations- und Haftungsthema relevant wird und wieso Mandanten ohne saubere Einsatzfall-Dokumentation strukturell unvorbereitet sind.',
        transcriptHighlights: [
          'Das Video arbeitet die Haftungskette vom realen KI-Einsatzfall bis zur Verantwortlichkeit der Organisation und der handelnden Personen heraus.',
          'Besonders klar wird gezeigt, warum Shadow AI, Lieferkettenanfragen und Auditdruck gerade für Kanzleien ein neues Beratungsfeld erzeugen.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/bb690c1d-570e-4014-a754-a675c0926912',
        resources: [
          {
            label: 'Handout: Haftungskette EU AI Act',
            href: '/resources/academy/legal/A1_Haftungskette_EU_AI_Act.pdf',
            format: 'PDF',
            description:
              'Juristisches Kurs-Handout zur Verantwortungs- und Haftungskette bei operativer KI-Nutzung im Unternehmen und in der Lieferkette.',
          },
          {
            label: 'Update: Standardisierung und Anschlussfähigkeit',
            href: '/updates/ai-act-standardisierung-2026',
            format: 'Seite',
            description:
              'Ergänzende Seite dazu, warum spätere Prüf- und Vergleichslogik schon heute in der Dokumentationsstruktur angelegt werden muss.',
          },
        ],
      },
      {
        id: 'juristen-2',
        slug: 'das-werkzeug-in-der-kanzleipraxis',
        title: 'Das Werkzeug in der Kanzleipraxis',
        presenter: 'Momo Feichtinger',
        duration: 'ca. 10 Minuten',
        summary:
          'Wie Organisation, Quick Capture, Review-Status, Export und Verify-Link im Register zusammenspielen und daraus ein belastbares Mandatsergebnis entsteht.',
        transcriptHighlights: [
          'Im Mittelpunkt steht der Use-Case Pass als kleinste vollständige Governance-Einheit, die für Audits, Due Diligence und Mandantenarbeit wirklich lesbar ist.',
          'Das Video zeigt außerdem, warum der Einsatzfall und nicht das Tool die richtige juristische und operative Analyseebene ist.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/3c4bcba0-71ff-4f19-9f77-703070f01442',
        resources: [
          {
            label: 'Handout: Use-Case Pass Anatomie für Kanzleien',
            href: '/resources/academy/legal/A2_UseCase_Pass_Anatomie.pdf',
            format: 'PDF',
            description:
              'Kurs-Handout zur Pass-Struktur, zur Falllogik und zur Frage, wie Kanzleien daraus ein auditfestes Mandantenartefakt machen.',
          },
          {
            label: 'Standard: Der Use-Case Pass',
            href: '/standards/use-case-pass',
            format: 'Seite',
            description:
              'Die ausführliche Referenzseite zum Standardnachweis, zur Evidenzlogik und zur Verbindung von Pass, Verify und Supplier Request.',
          },
        ],
      },
      {
        id: 'juristen-3',
        slug: 'neue-mandate-reaktivierte-mandanten',
        title: 'Neue Mandate, reaktivierte Mandanten',
        presenter: 'Zoltan Gal & Momo Feichtinger',
        duration: 'ca. 10 Minuten',
        summary:
          'Wie bestehende DSGVO- oder Compliance-Beziehungen in ein neues Governance-Mandat überführt werden und welche Triggerereignisse heute die stärksten Anknüpfungspunkte liefern.',
        transcriptHighlights: [
          'Das Modul zeigt, warum ruhende Bestandsmandate, Lieferkettenanfragen und Auditdruck die natürlichsten Startpunkte für juristische Governance-Arbeit sind.',
          'Dazu kommt die klare Positionierungsfrage: als EU AI Act Compliance Partner mit strukturiertem Arbeitsobjekt auftreten.',
        ],
        embedUrl:
          'https://killerplayer.com/watch/video/1fd2b660-e665-4f14-ad78-296aeeebeb07',
        resources: [
          {
            label: 'Handout: Reaktivierung und Positionierung',
            href: '/resources/academy/legal/A3_Reaktivierung_Positionierung.pdf',
            format: 'PDF',
            description:
              'Kurs-Handout für die Reaktivierung bestehender Mandanten, Trigger-Events und eine glaubwürdige juristische Positionierung rund um KI-Governance.',
          },
          {
            label: 'OEM Supplier Request Kit',
            href: '/artefacts/oem-supplier-request-kit',
            format: 'Seite',
            description:
              'Operatives Folgeartefakt für Mandanten, die auf Lieferkettenanfragen oder Due-Diligence-Fragebögen strukturiert antworten müssen.',
          },
        ],
      },
    ],
  },
];

export function getAcademyProgramDefinition(
  slug: string,
): AcademyProgramDefinition | null {
  return academyProgramDefinitions.find((program) => program.slug === slug) ?? null;
}

export function getAcademyLessonDefinition(
  programSlug: string,
  lessonSlug: string,
): AcademyProgramLesson | null {
  const program = getAcademyProgramDefinition(programSlug);
  if (!program) {
    return null;
  }

  return program.lessons.find((lesson) => lesson.slug === lessonSlug) ?? null;
}
