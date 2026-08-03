# Zoltan-Launchfilm und mobiler Player: Korrektur vom 3. August 2026

## Anlass

- Im deutschen Launchfilm war bei etwa 1:06 das Schlusswort „Zertifikat“ nicht vollständig hörbar.
- Nach dem Filmende konnte der Player beim Weiterscrollen auf Mobilgeräten unten rechts stehen bleiben.

## Videoschnitt

Der zuvor verwendete Rohabschnitt `107,08–108,28 s` war mit durchschnittlich `−75,7 dB` praktisch stumm. Er wurde durch den späteren vollständigen Take `122,24–123,44 s` ersetzt. Beide Abschnitte sind genau `1,2 s` lang und liegen auf 25-fps-Framegrenzen. Präsentation, PiP-Synchronität und Gesamtdauer bleiben dadurch unverändert.

AssemblyAI hat den finalen Ausschnitt `1:04,5–1:09,5` erneut mit `universal-3-pro` transkribiert. Ergebnis: „sowie Artikel-4-Schulungen mit Zertifikat, wenn viele Einsatzfälle“. Transcript-ID: `ee00153a-b54f-4ac8-9433-3e43239fbcf9`.

Die korrigierten deutschen Dateien verwenden neue URLs, damit Browser nicht auf eine bereits geladene Videoversion zurückfallen:

| Datei | Dauer | SHA-256 |
| --- | ---: | --- |
| `kiregister-launch-master-de-20260803.mp4` | 100,000 s | `7f0b4099ca6f9c3f5c9c709289e56b56c96de175f3f86127323b99c8a0e09e44` |
| `kiregister-launch-master-de-20260803.webm` | 100,018 s | `324dd5a24a9a2dcf48d86c4e5e0287781e2c5749c58f663afa9e692e88573508` |
| `kiregister-launch-de-20260803.vtt` | 40 Cues | `c29ed654971ed1b24fcd012ec5564168bc0c4de8d82b4e6e9da2605588a9734f` |

## Player-Verhalten

- Floating ist nur während laufender Wiedergabe möglich.
- Pause schließt das Floating-Fenster.
- `ended` setzt Master- und Floating-Zustand zurück und zeigt den Abspielknopf wieder an.
- Ein verspätetes `IntersectionObserver`-Ereignis kann das Fenster nach Filmende nicht erneut öffnen.

## Abnahme

- MP4 und WebM: 1920 × 1080, 30 fps, Stereo mit 48 kHz
- Gesamtdauer unverändert: 100 Sekunden
- VTT-Zeiten monoton und ohne Überlappungen
- 333 Unit-/Source-Tests und 14 Smoke-Suiten
- Mobile Regression bei 390 × 844: Floating nach `ended` dauerhaft geschlossen
- Desktop-Regression bei 1440 × 900: Floating während Wiedergabe erhalten, nach Pause geschlossen
- Typecheck, ESLint, Functions-Typecheck/-Build und Next-Produktionsbuild
