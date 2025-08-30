
export interface Principle {
    id: string;
    title: string;
    description: string;
    figure: string;
    company: string;
    article: string;
}

export const principlesData: Principle[] = [
    { id: "p1", title: "1. Würde über Code", description: "Wir entwickeln keine Systeme, die Menschen reduzieren. Jeder Algorithmus ist dem Menschen verpflichtet – nicht umgekehrt.", figure: "Immanuel Kant (1724–1804)", company: "Patagonia", article: "Art. 5 Abs. 1 – Verbot manipulativer Systeme" },
    { id: "p2", title: "2. Transparenz als Waffe", description: "Wir zeigen, was andere verbergen. Unsere Systeme erklären sich selbst – offen, nachvollziehbar, überprüfbar.", figure: "Galileo Galilei (1564–1642)", company: "Tesla", article: "Art. 13, Art. 50, Art. 52 – Transparenzpflichten" },
    { id: "p3", title: "3. Fairness statt Bias", description: "Wir lassen nicht zu, dass unsichtbare Vorurteile in den Code sickern. Wir messen, prüfen, justieren – bis niemand mehr benachteiligt wird.", figure: "Martin Luther King Jr. (1929–1968)", company: "Ben & Jerry’s", article: "Art. 10 – Datenqualität; Art. 15 – Robustheit" },
    { id: "p4", title: "4. Verantwortung hat einen Namen", description: "Jedes System hat einen Menschen, der dafür gerade steht. Keine Black Boxes ohne Gesichter.", figure: "Nürnberger Ärzteprozess (1946–1947)", company: "Toyota", article: "Art. 16–29 – Pflichten von Anbietern & Nutzern" },
    { id: "p5", title: "5. Privatsphäre ist heilig", description: "Unsere Daten sind nicht Rohstoff für Konzerne. Sie gehören den Menschen. Wir schützen sie mit Verschlüsselung, Anonymisierung, mit jedem Mittel.", figure: "Edward Snowden (*1983)", company: "Apple", article: "Art. 10 – Datenanforderungen; Bezug zur DSGVO" },
    { id: "p6", title: "6. Nutzen schlägt Risiko", description: "Wir bauen nichts, nur weil es geht. Wir bauen nur, wenn es den Menschen nützt. Alles andere ist Abfall.", figure: "Marie Curie (1867–1934)", company: "Philips Healthcare", article: "Art. 9 – Risikomanagement; Art. 15 – Sicherheit & Genauigkeit" },
    { id: "p7", title: "7. Der Mensch hat immer den roten Knopf", description: "Kein System darf sich selbst ermächtigen. Der Mensch kann verstehen, eingreifen, stoppen. Immer.", figure: "Stanislaw Petrow (1939–2017)", company: "Airbus", article: "Art. 14 – Human Oversight" },
    { id: "p8", title: "8. Kommunikation als Brücke", description: "Wir schweigen nicht hinter Fachjargon. Wir erklären, inspirieren, erzählen Geschichten – damit Vertrauen entsteht.", figure: "Sokrates (469–399 v. Chr.)", company: "TED", article: "Art. 13 – Nutzerinformationen; Art. 50 – Transparenzpflichten" },
    { id: "p9", title: "9. Gesellschaft & Erde zuerst", description: "Wir entwickeln nicht nur für Märkte, sondern für Gemeinschaft und Planet. Kein Profit ohne Zukunft.", figure: "Mahatma Gandhi (1869–1948)", company: "Interface Carpets", article: "Art. 1 – Zielsetzung; Erwägungsgründe 47–55" },
    { id: "p10", title: "10. Zukunftssicherheit als Pflicht", description: "Wir schreiben Code, der morgen noch standhält. Unsere Systeme sind vorbereitet auf Gesetze, die noch kommen.", figure: "Leonardo da Vinci (1452–1519)", company: "Microsoft", article: "Art. 15 – Robustheit; Art. 74 – Monitoring" }
];

export const manifest = {
    title: "EU AI Act – Vertrauen als revolutionäre Kraft. Das Manifest.",
    introduction: [
        "Der EU AI Act ist kein bürokratisches Hindernis, sondern ein Möglichkeitsraum. Er zwingt uns nicht, klein zu denken, sondern groß.",
        "Wer ihn als bloße Regulierung betrachtet, wird sich gegängelt fühlen. Wer ihn jedoch als Verbündeten begreift, dem schenkt er Innovation, Vertrauen und Zukunft.",
        "Dieses Manifest richtet sich an alle, die die Zukunft bilden wollen: Entwickler:innen, Entrepreneure, Kreative. An alle, die das Bewusstsein der Menschen nicht kontrollieren, sondern befreien wollen.",
        "Wir sind überzeugt: Der AI Act schützt das, was uns wichtig ist, und gibt zugleich die Freiheit, mutig zu gestalten. Er ist nicht unser Gegner, sondern unser stiller Verbündeter, der uns befähigt, Technologien zu bauen, die Bestand haben.",
        "Warum? Ich freue mich, dass du fragst."
    ],
    epilog: "„Die Form ist die geschworene Feindin der Willkür, die Zwillingsschwester der Freiheit.“",
    epilogSource: "— Rudolf von Jhering, Geist des römischen Rechts, 1856"
};

export interface DesignPhase {
    id: string;
    title: string;
    description: string;
    output: string;
}

export const designPhases: DesignPhase[] = [
    { id: "d1", title: "1. Verstehen", description: "Stakeholder-Map (innen/außen), Personas/Betroffene, Nutzungskontexte, potenzielle Schäden, sensible Situationen.", output: "Persona-Karten, Kontext-Risikoliste." },
    { id: "d2", title: "2. Definieren", description: "Problemstatement, Value Hypothesis, Non-Goals, Betroffenheitsanalyse (wer trägt welche Kosten/Risiken).", output: "klare Problemdefinition (1–3 Sätze), Scope-Abgrenzung." },
    { id: "d3", title: "3. Ideen finden", description: "Lösungsvarianten, Trade-offs, „What-if“-Fragen, Prinzipien-Canvas.", output: "3 Top-Konzepte mit Kurzbewertung." },
    { id: "d4", title: "4. Prototyp", description: "Dateninventar (Datenquellen, Rechtsgrundlage, Minimierung), Funktionsskizze, Human-Oversight-Plan (wann & wie eingreifen).", output: "Datenliste + Oversight-Checkliste." },
    { id: "d5", title: "5. Testen", description: "Testplan (Szenarien inkl. Edge-Cases), Bias-Checks (z. B. Demografie-Splits), Privacy-Probe (z. B. Pseudonymisierung), Logging-Plan.", output: "Testprotokoll mit Befunden & Nachbesserungen." },
];
