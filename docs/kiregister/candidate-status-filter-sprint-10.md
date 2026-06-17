# KIRegister Candidate Status Filter Sprint 10

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 10 macht die Agent Review Inbox besser steuerbar. Prüferinnen und
Prüfer können Kandidaten nach Status filtern, ohne den Review-Kontext zu
verlassen.

## Neue Oberfläche

Die Candidate-Liste zeigt jetzt Status-Segmente:

- Alle
- Review offen
- akzeptiert
- abgelehnt
- übernommen

Die Zählung pro Segment nutzt die bereits geladene Kandidatenliste. Der Sprint
ändert keine Serverdaten und führt keinen neuen Schreibpfad ein.

## Produktgrenze

Der Filter ist bewusst eine Arbeitsansicht:

- keine KPI-Inszenierung
- keine farbige Statusdramaturgie
- keine automatische Entscheidung
- keine Änderung am Merge-Workflow

## Nächster Sprint

Sprint 11 sollte denselben Statusfilter serverseitig verfügbar machen, damit
größere Register nicht immer die komplette Candidate-Liste laden müssen.
