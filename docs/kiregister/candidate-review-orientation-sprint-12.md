# KIRegister Candidate Review Orientation Sprint 12

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 12 verbessert die Orientierung in der Agent Review Inbox. Nach Review,
Ablehnung oder Merge soll klar sein, was der aktuelle Status operativ bedeutet.

## Änderungen

Die Candidate-Detailansicht zeigt jetzt einen sachlichen Status-Hinweis:

- `needs_review`: Evidenz, Dublettenhinweise und offene Fragen prüfen
- `accepted`: vor Übernahme prüfen, ob ein bestehender Einsatzfall passt
- `rejected`: Kandidat bleibt als Review-Nachweis erhalten
- `merged`: weitere Bearbeitung findet im erzeugten Einsatzfall statt

Wenn ein Statusfilter keine Kandidaten enthält, bietet die Tabelle die Aktion
`Alle anzeigen` an.

## Produktgrenze

Sprint 12 ändert keine Datenmodelle, keine API und keine Schreibrechte. Es ist
reine Review-Orientierung innerhalb der bestehenden Inbox.

## Nächster Sprint

Sprint 13 bündelt die Batch-Dokumentation, führt die Abschlussvalidierung aus
und pusht die fünf lokalen Sprint-Commits gemeinsam.

Batch-Notiz:
[`candidate-hardening-batch-sprints-9-13.md`](./candidate-hardening-batch-sprints-9-13.md).
