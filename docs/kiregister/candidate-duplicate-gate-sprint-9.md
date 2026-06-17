# KIRegister Candidate Duplicate Gate Sprint 9

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 9 härtet den Merge aus Sprint 8. Wenn ein Agent-Kandidat
Dublettenhinweise enthält, darf er erst als neuer Use Case übernommen werden,
nachdem diese Hinweise explizit geprüft wurden.

Damit bleibt der Merge nutzbar, aber verhindert die gefährlichste
Fehlbedienung: ein plausibler Agentenvorschlag erzeugt versehentlich einen
zweiten Registereintrag für denselben Einsatzfall.

## Server-Gate

Der bestehende Merge-Endpunkt akzeptiert jetzt einen kleinen Body:

```http
POST /api/workspaces/{orgId}/agent-kit/candidates/{candidateId}/merge?registerId=reg_123
```

```json
{
  "duplicateReviewConfirmed": true
}
```

Wenn `duplicateHints.length > 0` ist und `duplicateReviewConfirmed` nicht
`true` ist, bricht der Server mit `409` ab.

## Produktoberfläche

Die Agent Review Inbox zeigt im Merge-Bereich:

- Hinweis auf vorhandene Dublettenhinweise
- Checkbox `Dublettenhinweise vor der Übernahme geprüft`
- deaktivierte Übernahme, bis die Prüfung bestätigt wurde

Der bestehende Detailbereich `Mögliche Dubletten` bleibt die inhaltliche
Prüffläche.

## Sicherheitsgrenze

Sprint 9 ändert nicht:

- Candidate-Erstellung
- Review-Entscheidung
- Use-Case-Normalisierung
- Merge-Berechtigung
- bestehende Use Cases

Der Schutz liegt nur auf der Übernahmeentscheidung.

## Nächster Sprint

Als nächstes sollte die Review-Inbox selbst besser steuerbar werden:

- Status-Filter oder Status-Tabs
- stabilere leere Zustände
- bessere Orientierung nach Merge oder Ablehnung
