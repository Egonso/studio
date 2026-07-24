# Netlify Edge Crash Fix

Stand: 18.07.2026

## Symptom

`https://kiregister.com/de` antwortete sporadisch mit HTTP `502` und
`edge function invocation failed`. Ein identischer Abruf funktionierte meist,
schlug aber unter derselben Produktionsversion wiederholt fehl.

Beispiel aus der Reproduktion:

- Zeitpunkt: `2026-07-18T10:49:42Z`
- Route: `/de`
- Netlify Request ID: `01KXTDGYQTK5FGA4SV5HBBW86G`

## Technischer Kontext

Die Produktion verwendete `@netlify/plugin-nextjs` `5.15.3`. Die Anwendung
setzt Next.js Middleware mit `next-intl`, Rewrites und zusätzlichen
Response-Headern ein. Neuere Patch-Versionen des Netlify-Adapters enthalten
Korrekturen für Middleware-Rewrites mit Response-Headern sowie für das Laden
von Edge-Abhängigkeiten.

## Änderung

`@netlify/plugin-nextjs` wird auf `5.15.12` aktualisiert. An Routing,
Middleware-Logik, Laufzeitvariablen und Produktoberfläche wird nichts geändert.

## Validierung

Vor dem Merge sind erforderlich:

1. Typecheck, Lint, Tests und Produktions-Build laufen erfolgreich.
2. Der Netlify-Build erzeugt Server- und Edge-Artefakte mit Adapter `5.15.12`.
3. Der Deploy-Preview liefert `/de`, `/en` und die EUKI-Kursroute ohne `5xx`.
4. Wiederholte Abrufe von `/de` bleiben ohne Edge-Absturz.

## Rollback

Wenn der Preview neue Fehler zeigt, wird der Commit zurückgenommen und die
Abhängigkeit wieder auf `^5.15.3` gesetzt. Produktion bleibt bis zur
ausdrücklichen Preview-Abnahme unverändert.
