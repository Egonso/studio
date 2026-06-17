# KIRegister Candidate Review Decision Sprint 7

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 7 ergänzt die formale Review-Entscheidung für Agent-Kandidaten.
Reviewer können einen Kandidaten akzeptieren oder ablehnen und dabei eine
Begründung dokumentieren.

Wichtig: Dieser Sprint erzeugt weiterhin keinen echten Use Case.

## Neuer Endpunkt

```http
PATCH /api/workspaces/{orgId}/agent-kit/candidates/{candidateId}/review?registerId=reg_123
```

Payload:

```json
{
  "status": "accepted",
  "note": "Fachlich plausibel, Datenschutzkategorien müssen vor Merge ergänzt werden."
}
```

Zulässige Statuswerte:

```text
accepted
rejected
```

## Gespeicherte Review-Entscheidung

Am Candidate wird ein `reviewDecision`-Objekt gespeichert:

```json
{
  "status": "accepted",
  "note": "Fachlich plausibel.",
  "decidedAt": "2026-06-17T12:00:00.000Z",
  "decidedByUserId": "user_123",
  "decidedByEmail": "reviewer@example.com"
}
```

Zusätzlich wird der Candidate-Status aktualisiert und `updatedAt` gesetzt.

## Produktoberfläche

Die Agent Review Inbox zeigt in der Detailansicht:

- bestehende Entscheidung, falls vorhanden
- Notizfeld für Begründung oder Einschränkung
- Aktion `Review akzeptieren`
- Aktion `Ablehnen`

Die Oberfläche zeigt bewusst keine Aktion `Als Einsatzfall übernehmen`.

## Sicherheitsgrenze

Sprint 7 bleibt ein Review-Workflow:

- schreibt nur in `agentCandidates`
- schreibt nicht in `useCases`
- erstellt keine Registereinträge
- verwendet User-Authentifizierung mit Reviewer-Kontext
- verwendet nicht den lokalen Agent-Key im Browser

## Nächster Sprint

Sprint 8 sollte den Merge bewusst separat modellieren:

1. nur akzeptierte Kandidaten sind merge-fähig
2. Voransicht des Ziel-Use-Case vor dem Schreiben
3. Audit-Ereignis mit Candidate-ID, Reviewer und Merge-Actor
4. keine stille Überschreibung bestehender Use Cases
