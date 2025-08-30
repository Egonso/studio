
export interface CoachingStep {
    id: string;
    title: string;
    question: string;
    placeholder: string;
    hasFileUpload?: boolean;
}

export interface CoachingPath {
    id: 'horizont' | 'fundament' | 'hebel';
    title: string;
    description: string;
    steps: CoachingStep[];
}

interface CoachingData {
    horizont: CoachingPath;
    fundament: CoachingPath;
    hebel: CoachingPath;
}


export const coachingData: CoachingData = {
    horizont: {
        id: "horizont",
        title: "Vision Reverse Engineering",
        description: "Wir starten beim unmöglichen Ziel und arbeiten uns zurück zur Gegenwart.",
        steps: [
            {
                id: "h1",
                title: "1. Vision formulieren",
                question: "Beschreiben Sie die ideale Zukunft für Ihr Unternehmen oder Ihr Produkt in 3-5 Jahren. Wie sieht Erfolg aus? Was haben Sie erreicht? Seien Sie ambitioniert und inspirierend.",
                placeholder: "Beispiel: Wir sind der bekannteste Anbieter für KI-gestützte Compliance-Lösungen im deutschsprachigen Raum. Unsere Kunden vertrauen uns, weil unsere Tools ihnen nachweislich Zeit sparen und Sicherheit geben...",
                hasFileUpload: true,
            },
            {
                id: "h2",
                title: "2. Das 'unmögliche' Ziel",
                question: "Stellen Sie sich vor, Sie müssten diese Vision nicht in 3 Jahren, sondern in 6 Monaten erreichen. Welche eine, radikale Sache müssten Sie tun, um auch nur eine Chance zu haben? Ignorieren Sie für den Moment alle Einschränkungen.",
                placeholder: "Beispiel: Wir müssten eine Partnerschaft mit einem der größten Branchenverbände eingehen und unser Tool als Standard für alle Mitglieder etablieren.",
            },
            {
                id: "h3",
                title: "3. Prinzipien als Verstärker",
                question: "Wie können die Prinzipien des Manifests Ihr 'unmögliches' Ziel noch wertvoller machen? Wie stellen Sie z.B. Fairness und Transparenz sicher, um das Vertrauen für die große Partnerschaft zu gewinnen?",
                placeholder: "Beispiel: Indem wir unsere Algorithmen von einer unabhängigen Stelle prüfen lassen (Transparenz) und öffentlich dokumentieren, welche Daten wir wie verarbeiten (Verantwortung), schaffen wir das nötige Vertrauen.",
            }
        ]
    },
    fundament: {
        id: "fundament",
        title: "Bottleneck-Identifikation",
        description: "Wir finden den einen Engpass, der Ihr Wachstum am stärksten bremst.",
        steps: [
            {
                id: "f1",
                title: "1. Ziel definieren",
                question: "Was ist das konkrete, messbare Ziel, das Sie aktuell nicht wie gewünscht erreichen? Wo stagniert Ihr Fortschritt?",
                placeholder: "Beispiel: Wir wollen die Anzahl der Support-Tickets, die manuell beantwortet werden müssen, innerhalb von 3 Monaten um 50% reduzieren, aber wir kommen nicht voran.",
            },
            {
                id: "f2",
                title: "2. Engpass analysieren",
                question: "Was ist die tiefere Ursache, der wahre Engpass, der Sie blockiert? Fragen Sie 'Warum?' - mindestens dreimal.",
                placeholder: "Beispiel: Warum kommen wir nicht voran? -> Weil die KI falsche Antworten gibt. -> Warum? -> Weil sie keinen Zugriff auf die aktuelle Dokumentation hat. -> Warum? -> Weil es keinen Prozess gibt, um neue Doku automatisch zu synchronisieren. Der Engpass ist der fehlende Sync-Prozess.",
            },
            {
                id: "f3",
                title: "3. Prinzipien als Lupe",
                question: "Betrachten Sie den Engpass durch die Brille der Prinzipien. Berührt er Risiken, Datenschutz oder die menschliche Aufsicht? Wie hilft der AI Act, die Wichtigkeit dieses Engpasses zu verstehen?",
                placeholder: "Beispiel: Fehlender Sync (Engpass) führt zu falschen Antworten, was ein Reputationsrisiko ist (Nutzen schlägt Risiko). Wenn falsche rechtliche Auskünfte gegeben werden, fehlt die 'menschliche Aufsicht'. Das Problem ist also nicht nur technisch, sondern ein Compliance-Thema.",
            }
        ]
    },
    hebel: {
        id: "hebel",
        title: "Hebel-Finder",
        description: "Wir identifizieren die eine, entscheidende Maßnahme, die die größte Wirkung entfaltet.",
        steps: [
            {
                id: "g1",
                title: "1. Engpass benennen",
                question: "Formulieren Sie den zentralen Engpass, den Sie aus dem vorherigen Schritt identifiziert haben, in einem klaren Satz.",
                placeholder: "Beispiel: Unser zentraler Engpass ist, dass unser KI-System nicht automatisch auf die neueste Produktdokumentation zugreifen kann, was zu veralteten und falschen Kundenantworten führt.",
            },
            {
                id: "g2",
                title: "2. Hebel brainstormen",
                question: "Welche eine Maßnahme oder welches eine Projekt würde diesen Engpass am elegantesten und wirkungsvollsten auflösen und eine positive Kettenreaktion auslösen?",
                placeholder: "Beispiel: Die Einführung eines zentralen 'Dokumenten-Tresors' (z.B. ein dedizierter Cloud-Ordner), der als einzige Quelle für die KI dient und von allen Teams aktuell gehalten werden MUSS.",
            },
            {
                id: "g3",
                title: "3. Hebel verstärken",
                question: "Wie machen die Prinzipien diesen Hebel noch mächtiger? Wie wird aus einer technischen Lösung ein strategischer Vorteil in Bezug auf Compliance, Vertrauen und Kommunikation?",
                placeholder: "Beispiel: Der 'Dokumenten-Tresor' (Hebel) wird zur Grundlage unserer technischen Dokumentation (Art. 11). Wir kommunizieren proaktiv, dass unsere KI nur auf geprüfte Quellen zugreift (Kommunikation als Brücke) und schaffen so einen Vertrauensvorsprung.",
            }
        ]
    }
};
