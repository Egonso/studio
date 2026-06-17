# KIRegister Candidate Review UI Sprint 6

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 6 verbindet die Candidate-Inbox mit einer menschlichen Review-Fläche.
Lokale Agenten können Kandidaten ablegen; angemeldete Prüferinnen und Prüfer
können diese Kandidaten im Produkt lesen, ohne echte Registereinträge zu
erzeugen.

## Neue Produktoberfläche

Route:

```text
/settings/agent-kit/candidates
```

Die Seite zeigt:

- Workspace- und Register-Auswahl
- Liste der Review-Kandidaten
- Status, Review-Fragen, Evidenzzahl und Aktualisierung
- Detailansicht mit Zweck, Systemen, Blockern, Quelle, Review-Fragen,
  Evidenz, Dublettenhinweisen und Manifest-Auszug

Die Agent-Kit-Settings verlinken direkt auf diese Review-Inbox.

## Neue Human-Review-Endpunkte

```http
GET /api/workspaces/{orgId}/agent-kit/candidates?registerId=reg_123
GET /api/workspaces/{orgId}/agent-kit/candidates/{candidateId}?registerId=reg_123
```

Diese Endpunkte verwenden normale User-Authentifizierung, nicht den lokalen
Agent-Key. Für persönliche Register reicht der Eigentümerkontext. Für
Workspace-Register ist Reviewer-Zugriff erforderlich.

## Sicherheitsgrenze

Sprint 6 bleibt read-only:

- kein `POST`
- kein `PATCH`
- keine Statusänderung
- kein Schreiben in `useCases`
- keine Übernahme in echte Registereinträge

Die Übernahme muss als eigene formale Workflow-Aktion modelliert werden,
bevor sie ins Produkt kommt.

## Technische Struktur

Neue gemeinsame Hilfen:

- `authorizeAgentOperatorCandidateReview`
- `listAgentOperatorCandidatesForLocation`
- `getAgentOperatorCandidateForLocation`

Damit teilen sich Agent-API und Human-Review-Pfad die Candidate-Parsinglogik,
aber nicht die Authentifizierungslogik.

## UI-Charta-Abgleich

- Primäres Objekt der Seite ist die Review-Inbox.
- Status wird ruhig als Text/Outline dargestellt.
- Evidence und Review-Fragen stehen vor Agentenherkunft.
- Keine Automations- oder Agenten-Dramaturgie.
- Keine Übernahmeaktion, solange der formale Workflow fehlt.

## Nächster Sprint

Sprint 7 sollte die formale Review-Aktion modellieren:

1. Candidate-Status `accepted` / `rejected` als dokumentierter Review-Schritt
2. Reviewer, Zeitstempel und Begründung speichern
3. weiterhin keine automatische Erstellung echter Use Cases
4. erst danach separater Merge-Sprint mit Audit-Historie
