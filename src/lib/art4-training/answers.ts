import 'server-only';

/**
 * Korrekte Antwort-Indizes der Art.-4-Lernkontrollen.
 * Server-only: darf nie ins Client-Bundle gelangen.
 * Reihenfolge entspricht ART4_MODULES[slug].quiz.
 */
export const ART4_ANSWER_KEYS: Record<string, number[]> = {
  geschaeftsfuehrung: [1, 2, 0, 2, 1, 1, 2, 0],
  hr: [1, 0, 0, 1, 1, 0, 2, 1],
  sachbearbeitung: [0, 1, 1, 2, 0, 1, 1, 2],
  it: [0, 1, 1, 1, 3, 2, 0, 1],
};
