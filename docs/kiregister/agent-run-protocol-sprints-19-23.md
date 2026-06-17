# KIRegister Agent Run Protocol Sprints 19-23

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block ergänzt operative Nachvollziehbarkeit für lokale und
workspace-gebundene Agentenläufe.

Die Produktgrenze bleibt bewusst eng: Ein Agentenlauf ist ein Protokoll. Er
ist kein echter Registereintrag und verändert keinen Use Case.

## Enthaltene Sprints

### Sprint 19: Run-Protokoll als eigene Server-Entität

Neue Sammlung:

```text
users/{ownerId}/registers/{registerId}/agentRuns/{runId}
```

Ein Run dokumentiert:

- Status
- Start- und Abschlusszeit
- Modus und Cadence
- gelesene Quellen
- Evidenzanzahl
- Kandidatenanzahl
- offene Review-Fragen
- übersprungene Quellen
- Fehlertext, falls vorhanden

### Sprint 20: Operator Run API

Neue Agent-Operator-Endpunkte:

```http
GET /api/agent/operator/runs?registerId=reg_123
POST /api/agent/operator/runs
GET /api/agent/operator/runs/{runId}?registerId=reg_123
PATCH /api/agent/operator/runs/{runId}?registerId=reg_123
```

Diese Endpunkte nutzen vorerst den bestehenden Candidate-Operator-Scope
`write:candidate`, weil Run-Protokolle zum Candidate-Review-Pfad gehören.

Wichtig: Diese Endpunkte schreiben nur Run-Protokolle. Sie erzeugen keine
Use Cases und keine Candidate-Reviews.

### Sprint 21: Workspace-Lesepfade für Menschen

Neue Workspace-Endpunkte:

```http
GET /api/workspaces/{orgId}/agent-kit/runs?registerId=reg_123
GET /api/workspaces/{orgId}/agent-kit/runs/{runId}?registerId=reg_123
```

Die Detailroute liefert zusätzlich die Kandidaten, deren
`source.runId` zum Run passt. Dadurch wird sichtbar, welche Vorschläge aus
welchem Agentenlauf entstanden sind.

### Sprint 22: Lokale CLI-Anbindung

`studio-agent operator` erhält Run-Befehle:

```bash
studio-agent operator runs --register-id reg_123 --json
studio-agent operator run run_20260617_001 --register-id reg_123 --json
studio-agent operator run submit ./_autopilot-evidence/run_20260617_001.json --register-id reg_123
```

Der lokale Autopilot bleibt weiterhin draft-only. Das Submit eines Run-JSONs
dokumentiert nur das Laufprotokoll.

### Sprint 23: Kandidaten-Historie je Run

Candidate-Listen können zusätzlich per `runId` gefiltert werden:

```http
GET /api/agent/operator/candidates?registerId=reg_123&runId=run_20260617_001
GET /api/workspaces/{orgId}/agent-kit/candidates?registerId=reg_123&runId=run_20260617_001
```

Die Statuscounts werden dabei ebenfalls auf den Run begrenzt.

## Akzeptanzkriterien

- Run-Protokolle sind eigene Dokumente und keine Use Cases.
- Operator-Keys können Run-Protokolle dokumentieren, aber keine echten
  Registereinträge verändern.
- Menschliche Workspace-Lesepfade laufen über bestehende Reviewer-Auth.
- Kandidaten können je Run nachvollzogen werden.
- Die lokale CLI kann Run-Protokolle einreichen.
- Es gibt weiterhin keine stille Übernahme in das Register.

## Nächste sinnvolle Blöcke

Nach diesem Backend-/CLI-Fundament sollte die UI folgen:

Die Run-Liste und der Run-Filter in der Agent-Review-Inbox sind im direkten
Folgeblock dokumentiert:
[`agent-run-review-ui-sprints-24-28.md`](./agent-run-review-ui-sprints-24-28.md).

Danach bleiben:

- Run-Detailansicht mit Fehler- und Skipped-Source-Kontext
- Exportfähiger Candidate-Review-Auszug
- später eigener `read:audit`-Scope für Run- und Audit-Lesezugriffe
