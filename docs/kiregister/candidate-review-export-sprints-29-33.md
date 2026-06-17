# KIRegister Candidate Review Export Sprints 29-33

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block macht den Review-Stand exportfähig.

Der Export ist ein Nachweisartefakt. Er ist keine Mutation und ersetzt keine
Use-Case-Pässe.

## Enthaltene Sprints

### Sprint 29: Server-Export für Candidate-Reviews

Neuer Endpunkt:

```http
GET /api/workspaces/{orgId}/agent-kit/review-export?registerId=reg_123
```

Optionale Filter:

```http
status=needs_review
runId=run_20260617_001
```

Der Endpunkt nutzt dieselbe Reviewer-Autorisierung wie die Candidate-Inbox.

### Sprint 30: Exportinhalt

Der JSON-Auszug enthält:

- Exporttyp und Schema-Version
- Erzeugungszeit
- Register-Kontext
- aktive Filter
- optionales Run-Protokoll
- Statuscounts
- Kandidatenzusammenfassungen

Der Export ist auf 200 Kandidaten begrenzt, damit die Review-Inbox kein
ungewollter Bulk-Exportkanal wird.

### Sprint 31: UI-Download

Die Review-Inbox erhält `Review-Auszug exportieren`.

Der Download berücksichtigt:

- aktives Register
- Statusfilter
- Run-Filter

### Sprint 32: Nachweis statt Schreibaktion

Der Export schreibt nichts:

- kein Candidate-Statuswechsel
- kein Merge
- kein Use Case
- kein Run-Update

### Sprint 33: Blockabschluss

Der Block ist gegen ESLint, Typecheck und Auth-Routentest validiert.

## Akzeptanzkriterien

- Der Export-Endpunkt ist reviewer-geschützt.
- Der Export ist rein lesend.
- Die UI erzeugt einen JSON-Download aus dem serverseitigen Export.
- Aktive Filter werden im Export dokumentiert.
- Der Export bleibt bounded und auditnah.

## Nächste sinnvolle Blöcke

Der Audit-Operator-Scope `read:audit` ist im direkten Folgeblock umgesetzt und
dokumentiert:
[`audit-operator-scope-sprints-34-38.md`](./audit-operator-scope-sprints-34-38.md).

Danach bleiben:

- Run-Detailansicht mit Fehler- und Skipped-Source-Kontext
- visueller Preview-/Browser-Check der Review-Inbox
- später Exportformat als signierbarer Audit-Anhang
