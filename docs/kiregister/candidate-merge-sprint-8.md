# KIRegister Candidate Merge Sprint 8

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 8 erlaubt die kontrollierte Übernahme eines akzeptierten
Review-Kandidaten als neuen Registereintrag.

Das ist der erste Sprint in dieser Serie, der aus einem Agent-Kandidaten einen
echten Use Case erzeugt. Deshalb ist der Merge bewusst eng begrenzt.

## Neuer Endpunkt

```http
POST /api/workspaces/{orgId}/agent-kit/candidates/{candidateId}/merge?registerId=reg_123
```

Der Endpunkt akzeptiert keinen freien Payload. Die Quelle ist immer der
gespeicherte Candidate.

## Merge-Regeln

Ein Candidate kann nur übernommen werden, wenn:

- er existiert
- er zum angegebenen Register gehört
- der User Reviewer-Zugriff auf den Workspace hat
- der Candidate-Status `accepted` ist
- noch kein `mergeResult` gespeichert ist

Der Merge schreibt in einer Firestore-Transaktion:

1. neuen Use Case unter `useCases/{useCaseId}`
2. Candidate-Status `merged`
3. `mergeResult` mit Use-Case-ID, Actor und Zeitstempel

Bestehende Use Cases werden nicht überschrieben.

## Produktoberfläche

Die Agent Review Inbox zeigt den Merge nur in der Candidate-Detailansicht.

- Bei nicht akzeptierten Kandidaten bleibt die Übernahme deaktiviert.
- Nach Merge wird der erzeugte Einsatzfall verlinkt.
- Ein erneuter Merge desselben Kandidaten ist blockiert.

## Nachweis

Der erzeugte Use Case erhält:

- normale Agent-Kit-Manifest-Normalisierung
- Review-Hinweis mit Candidate-ID
- Label `agent_candidate_id`

Damit bleibt der Ursprung des Use Case aus dem Agent-Kandidaten nachvollziehbar.

## Nächster Sprint

Der Kernpfad ist damit end-to-end arbeitsfähig:

1. lokaler Agent reicht Candidate ein
2. Mensch prüft Candidate
3. Mensch akzeptiert oder lehnt ab
4. akzeptierter Candidate wird kontrolliert als Use Case übernommen

Der nächste sinnvolle Sprint wäre kein weiterer Schreibpfad, sondern
Produkt-Härtung:

- Duplicate-Preview vor Merge
- Audit-Timeline-Eintrag im Use Case
- Filter und Status-Tabs in der Review-Inbox
- bessere leere Zustände für neue Organisationen
