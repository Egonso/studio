# KIRegister Candidate Hardening Batch Sprints 9-13

Stand: 2026-06-17
Status: Lokal implementiert, als Batch validiert

## Ziel

Dieser Batch härtet den end-to-end Candidate-Pfad aus den Sprints 3-8.

Nicht Ziel des Batches:

- neue Autopilot-Autonomie
- automatische Governance-Entscheidungen
- weitere stille Schreibpfade

Ziel des Batches:

- Merge-Fehlbedienung reduzieren
- Review-Inbox besser steuerbar machen
- lokale Operator-Nutzung konsistenter machen
- bessere Orientierung nach Review und Merge geben

## Enthaltene Sprints

### Sprint 9: Duplicate-Review-Gate

Kandidaten mit Dublettenhinweisen können nur übernommen werden, wenn die
Dublettenprüfung explizit bestätigt wurde.

Dokumentation:
[`candidate-duplicate-gate-sprint-9.md`](./candidate-duplicate-gate-sprint-9.md)

### Sprint 10: Status-Filter in der Review-Inbox

Die Review-Inbox kann lokal nach `needs_review`, `accepted`, `rejected` und
`merged` gefiltert werden.

Dokumentation:
[`candidate-status-filter-sprint-10.md`](./candidate-status-filter-sprint-10.md)

### Sprint 11: Status-Filter in APIs und CLI

Candidate-Listen können serverseitig per `status` gefiltert werden. Die lokale
CLI unterstützt:

```bash
studio-agent operator candidates --status needs_review --json
```

Dokumentation:
[`candidate-api-status-filter-sprint-11.md`](./candidate-api-status-filter-sprint-11.md)

### Sprint 12: Review-Orientierung

Die Candidate-Detailansicht erklärt den nächsten sinnvollen Schritt je nach
Status und bietet bei leeren Filtern `Alle anzeigen` an.

Dokumentation:
[`candidate-review-orientation-sprint-12.md`](./candidate-review-orientation-sprint-12.md)

### Sprint 13: Batch-Abschluss

Dieser Abschluss bündelt Validierung, Dokumentation und gemeinsamen Push der
lokalen Sprint-Commits.

## Akzeptanzkriterien

- Duplicate-Hinweise blockieren Merge ohne explizite Bestätigung.
- Statusfilter funktionieren in UI, API und CLI.
- Review-Entscheidungen und Merges bleiben getrennte formale Aktionen.
- Der Merge bleibt auf akzeptierte Kandidaten beschränkt.
- Der Browser verwendet weiterhin User-Auth, nicht den lokalen Agent-Key.
- Alle Tests und Checks für den betroffenen Bereich laufen grün.

## Nächste sinnvolle Schritte

Nach diesem Batch lohnt sich vor allem Produkt-Härtung:

- Audit-Timeline-Eintrag im erzeugten Use Case
- Merge-Voransicht vor dem Schreiben
- serverseitige Statuscounts für große Review-Inboxen
- visuelle QA der authentifizierten Review-Inbox in Preview
