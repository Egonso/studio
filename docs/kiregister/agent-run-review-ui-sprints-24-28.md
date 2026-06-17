# KIRegister Agent Run Review UI Sprints 24-28

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block macht Agent-Run-Protokolle in der Review-Inbox sichtbar.

Die UI bleibt kandidat-zentriert: Der Lauf erklärt die Herkunft der
Kandidaten, ersetzt aber nicht den menschlichen Review.

## Enthaltene Sprints

### Sprint 24: Run-Liste in der Review-Inbox

Die Seite `/settings/agent-kit/candidates` zeigt eine kompakte Tabelle der
letzten Agentenläufe zum aktiven Register.

Sichtbare Felder:

- Run-ID
- Status
- Kandidatenanzahl
- offene Review-Fragen
- Aktion `Kandidaten anzeigen`

### Sprint 25: Run-Filter für Kandidaten

Ein ausgewählter Run setzt `runId` auf der Candidate-Listen-API.

Dadurch werden Kandidaten und Statuscounts auf diesen Lauf begrenzt.

```http
GET /api/workspaces/{orgId}/agent-kit/candidates?registerId=reg_123&runId=run_20260617_001
```

### Sprint 26: Ruhige Statusdarstellung

Run-Status werden als sachliche Labels dargestellt:

- `running`
- `needs_review`
- `no_candidates`
- `completed`
- `failed`

Keine Alarmfarben, keine Autopilot-Magie, keine KPI-Dramaturgie.

### Sprint 27: Kandidatenarbeit bleibt primär

Die Candidate-Tabelle und Candidate-Detailansicht bleiben die eigentliche
Arbeitsfläche.

Run-Protokolle dienen nur der Herkunft und Nachvollziehbarkeit.

### Sprint 28: Blockabschluss

Der Block ist gegen ESLint und Typecheck validiert.

## Akzeptanzkriterien

- Run-Protokolle sind für Reviewer sichtbar.
- Ein Run kann die Candidate-Liste filtern.
- Statuscounts folgen dem aktiven Run-Filter.
- Der Run-Filter kann entfernt werden.
- Die Oberfläche bleibt nach Governance UI Charta ruhig und dokumentenzentriert.
- Es gibt keine neuen Mutationspfade in der UI.

## Nächste sinnvolle Blöcke

- Exportfähiger Candidate-Review-Auszug
- Run-Detailseite mit Kandidatenliste und Fehler-/Skipped-Source-Kontext
- Visuelle QA der authentifizierten Review-Inbox
- eigener `read:audit`-Scope für auditnahe Lesezugriffe
