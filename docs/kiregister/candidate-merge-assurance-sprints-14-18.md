# KIRegister Candidate Merge Assurance Sprints 14-18

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block macht die Übernahme von Review-Kandidaten belastbarer, bevor wir
weitere Autopilot-Autonomie ergänzen.

Die wichtigste Produktentscheidung bleibt bestehen: Agenten dürfen Kandidaten
vorbereiten. Echte Registereinträge entstehen erst nach menschlicher Prüfung.

## Enthaltene Sprints

### Sprint 14: Serverseitige Statuscounts

Die Candidate-Listen-API liefert neben der aktuellen Seite jetzt
`totalCount` und `statusCounts` für alle Candidate-Status.

Damit muss die Review-Inbox bei großen Kandidatenmengen nicht mehr alle
Kandidaten laden, nur um die Filterzahlen korrekt anzuzeigen.

Betroffene Antworten:

```http
GET /api/agent/operator/candidates?registerId=reg_123
GET /api/workspaces/{orgId}/agent-kit/candidates?registerId=reg_123
```

Antwortauszug:

```json
{
  "count": 50,
  "totalCount": 137,
  "statusCounts": {
    "needs_review": 88,
    "accepted": 14,
    "rejected": 21,
    "merged": 14
  }
}
```

### Sprint 15: Merge-Voransicht vor dem Schreiben

Der Merge-Endpunkt hat zusätzlich einen `GET`-Pfad:

```http
GET /api/workspaces/{orgId}/agent-kit/candidates/{candidateId}/merge?registerId=reg_123
```

Dieser Pfad erzeugt denselben Use-Case-Entwurf wie der spätere Merge, schreibt
aber nichts. Die Review-Inbox zeigt diese Voransicht an und deaktiviert den
Merge-Button, wenn die Preview nicht verfügbar ist oder blockierende Gründe
zurückmeldet.

### Sprint 16: Audit-Timeline-Eintrag im erzeugten Use Case

Beim Merge wird im erzeugten Use Case ein `manualEdits`-Eintrag dokumentiert.
Der bestehende Timeline-Builder macht daraus einen `manual_edit`-Timeline-
Eintrag.

Der Eintrag dokumentiert:

- Kandidaten-ID
- Zeitpunkt
- ausführenden Nutzer
- übernommene Nachweisfelder

Zusätzlich werden Labels und Review-Hinweise gesetzt, damit der Ursprung des
Use Cases im Register nachvollziehbar bleibt.

### Sprint 17: Review-Inbox UI

Die Review-Inbox verwendet die serverseitigen Statuscounts für die Filter und
zeigt vor dem Merge eine ruhige dokumentenzentrierte Voransicht.

Die UI folgt der Governance UI Charta:

- keine Alarmfarben
- keine KPI-Inszenierung
- Vorschau als Nachweisprüfung
- Merge als formale Objektaktion des Kandidaten

### Sprint 18: Blockabschluss

Der Block wird zusammen mit Tests, Typecheck und Dokumentation gepusht.

## Akzeptanzkriterien

- Die Statuszahlen bleiben korrekt, auch wenn nur ein Status geladen wird.
- Der Schreibpfad `POST /merge` bleibt getrennt von der Voransicht `GET /merge`.
- Der Merge-Button ist ohne erfolgreiche Voransicht nicht aktiv.
- Nicht akzeptierte oder bereits übernommene Kandidaten melden blockierende
  Gründe in der Voransicht.
- Der erzeugte Use Case enthält einen Timeline-fähigen Audit-Eintrag.
- Dublettenhinweise bleiben zusätzlich bestätigungspflichtig.
- Es gibt weiterhin keine stillen Mutationen durch den lokalen Agenten.

## Nächste sinnvolle Blöcke

Nach diesem Block sollte der nächste große Abschnitt die operative
Nachvollziehbarkeit stärken.

Der direkte Folgeblock für Agent-Run-Protokolle ist dokumentiert in
[`agent-run-protocol-sprints-19-23.md`](./agent-run-protocol-sprints-19-23.md).

Danach bleiben für die Oberfläche:

- visuelle QA der authentifizierten Review-Inbox in einer Preview-Umgebung
- Export/Audit-Auszug für Candidate-Reviews
