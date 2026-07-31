# KIRegister Landing Hero: Klarheit und Vertrauensanker

Stand: 31. Juli 2026

## Problem

Auf kleinen Viewports konkurrierten die abstrakte Hero-Erzählung, der wissenschaftliche Vertrauensanker und acht Direktlinks um die erste Aufmerksamkeit. Testpersonen erkannten dadurch nicht schnell genug, was KIRegister tut.

## Ziel

Der erste View beantwortet drei Fragen in dieser Reihenfolge:

1. Was ist hier zu tun? KI-Einsatz dokumentieren.
2. Wie beginne ich? Einen realen Einsatzfall in rund 30 Sekunden erfassen.
3. Warum ist das glaubwürdig? Wissenschaftliche Einordnung von Prof. Dr. Janine Wendt.

## Umsetzung

- klare Hero-Aussage: „KI-Einsatz gehört ins Register.“
- konkrete 30-Sekunden-Erfassung als primärer Einstieg
- typografisch eigenständiger, verlinkter Wendt-Vertrauensanker
- bestehende Chaos-zu-Ordnung-Scroll-Erzählung unverändert beibehalten
- acht sekundäre Direktlinks aus dem Hero in einen eingeklappten Bereich nach den drei Haupteinstiegen verschoben
- deutsche und englische Variante angepasst
- Mobile-Hierarchie, Abstände und Schriftgrößen neu austariert

## Produkt- und Claim-Grenzen

- keine Zertifizierungs- oder Compliance-Garantie
- Zitat bleibt ein freigegebener Auszug der wissenschaftlichen Stellungnahme
- „rund 30 Sekunden“ beschreibt die bestehende Schnellerfassung, nicht die vollständige Registerführung

## Prüfung

- TypeScript-Transpilation ohne Diagnose
- CSS-Parsing erfolgreich
- Public-Copy-Audit ohne Befund
- Netlify-Preview und visuelle Mobile-/Desktop-Abnahme werden am Pull Request dokumentiert

## Rückbau

Die Änderung betrifft ausschließlich den Landing-Client und dessen CSS-Modul. Ein Revert der Branch-Commits stellt den vorherigen Hero wieder her.
