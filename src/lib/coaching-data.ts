
export interface Amplifier {
    principle: string;
    article: string;
    description: string;
}

export interface TripleKey {
    id: string;
    title: string;
    principle: string;
    question: string;
    example: string;
    amplifiers: Amplifier[];
}

export const scalingData: TripleKey[] = [
    {
        id: "horizont",
        title: "1️⃣ Vision Reverse Engineering („Horizont“)",
        principle: "Starte beim unmöglichen Ziel – eines, das größer ist als die aktuelle Organisation.",
        question: "„Wenn wir in 5 Jahren ein Branchenvorreiter wären – wie sähe das aus?“",
        example: "„Wir sind das vertrauenswürdigste KI-Unternehmen in Europa – und werden dafür mit Marktanteilen und Partnerschaften belohnt.“",
        amplifiers: [
            { principle: "Würde über Code", article: "Art. 5", description: "Schützt Autonomie, zwingt dazu, die Vision nicht in manipulativen Praktiken zu verlieren." },
            { principle: "Transparenz", article: "Art. 13, 50, 52", description: "Macht die Vision überprüfbar – keine Marketingfloskel, sondern nachvollziehbar." },
            { principle: "Fairness", article: "Art. 10, 15", description: "Zwingt, Gerechtigkeit in die Zielbilder einzubauen." },
            { principle: "Verantwortung", article: "Art. 16–29", description: "Verhindert, dass die Vision im Abstrakten verharrt – sie braucht Namen und Verantwortliche." },
        ]
    },
    {
        id: "fundament",
        title: "2️⃣ Bottleneck-Identifikation („Fundament“)",
        principle: "Finde den Engpass, der alles blockiert. Der Engpass ist nicht Schwäche, sondern das Tor, durch das Transformation gehen muss.",
        question: "„Welcher Engpass verhindert am stärksten, dass wir unser Ziel erreichen?“",
        example: "„Unsere KI-Projekte skalieren nicht, weil kein Bias-Check-Prozess dokumentiert ist.“",
        amplifiers: [
            { principle: "Privatsphäre", article: "Art. 10, DSGVO", description: "Zeigt Engpässe, wenn Datenpraxis Vertrauen zerstört." },
            { principle: "Nutzen schlägt Risiko", article: "Art. 9, 15", description: "Macht sichtbar, wenn Aufwand größer ist als Nutzen." },
            { principle: "Der rote Knopf", article: "Art. 14", description: "Markiert Engpässe, wenn Kontrollmechanismen fehlen." },
            { principle: "Gesellschaft & Erde zuerst", article: "Art. 1, Erwägungsgründe 47–55", description: "Legt offen, wenn das Fundament kulturell oder ökologisch nicht tragfähig ist." },
        ]
    },
    {
        id: "hebel",
        title: "3️⃣ Hebel-Finder („One-Thing Execution“)",
        principle: "Suche die eine Maßnahme, die, wenn sie gelingt, eine Kettenreaktion auslöst.",
        question: "„Welche Intervention würde das Bottleneck aufsprengen und das ganze System in Bewegung setzen?“",
        example: "„Ein verpflichtendes KI-Logbuch einführen.“ → löst Transparenz, Bias-Checks, interne Kommunikation und Auditierbarkeit gleichzeitig aus.",
        amplifiers: [
            { principle: "Kommunikation als Brücke", article: "Art. 13, 50", description: "Macht den Hebel anschlussfähig – intern wie extern." },
            { principle: "Zukunftssicherheit", article: "Art. 15, 74", description: "Verhindert, dass der Hebel nur kurzfristig wirkt." },
            { principle: "Fairness", article: "Art. 10, 15", description: "Priorisiert Hebel, die nicht nur effizient, sondern auch gerecht sind." },
            { principle: "Accountability", article: "Art. 16–29", description: "Verankert den Hebel in Führungsverantwortung, nicht nur Technik." },
        ]
    }
];

export const manifest = {
    title: "Triple-Key Strategie-Engine + EU AI Act Booster",
    description: "Aus einem Compliance-Rahmen wird eine Strategie-Engine, die Vision, Engpässe und Hebel in den Flow bringt. Die 10 Prinzipien wirken als Fragensteller und Verstärker – sie machen jedes Produkt besser, robuster und marktattraktiver."
}
