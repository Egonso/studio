# Zoltan landing video release

Stand: 2026-07-30

## Scope

- Deutscher und englischer Launchfilm mit Zoltans Originalaufnahme
- Harte Schnitte auf späteren vollständigen Takes
- Sprachabhängige Szenen-Timelines statt proportionaler Streckung
- Kleines ovales Sprecherbild unten rechts
- Neu basierte WebVTT-Untertitel
- Verkürztes Wendt-Zitat im Hero mit Name und vollständiger Funktion

## Mediennachweis

| Datei | Dauer | Format | SHA-256 |
| --- | ---: | --- | --- |
| `kiregister-launch-master-de.mp4` | 100,000 s | H.264/AAC, 1920 × 1080, 30 fps | `d0e72a74e86e8569c54d5c9b37a86251bd9546bcc37b165ec01d3fd373baf32e` |
| `kiregister-launch-master-en.mp4` | 101,600 s | H.264/AAC, 1920 × 1080, 30 fps | `afd5c2963e455f3999ff933f497f9120457a3fb03577b20b5aa3d779e1f65d67` |
| `kiregister-launch-master-de.webm` | 100,018 s | VP9/Opus, 1920 × 1080, 30 fps | `9bd7ea5ee1972f84ac1a4551ac02a85ae397a10a4f7d800175bcfd438fc6f575` |
| `kiregister-launch-master-en.webm` | 101,618 s | VP9/Opus, 1920 × 1080, 30 fps | `4f29167758445342e93be771d5f3e910a0776777290a2456571605e595667ad5` |

Die deutsche Fassung hat eine integrierte Lautheit von −16,6 LUFS, die englische Fassung −16,0 LUFS. Beide Fassungen liegen bei −1,0 dBFS True Peak.

## Schnittentscheidungen

- DE: Drei fehlerhafte oder abgebrochene Handoff-Anläufe wurden verworfen. Verwendet wird ausschließlich der spätere vollständige Handoff, danach die CTA.
- EN: Der vollständige Produktfilm-Take endet bei 02:09,086 der Quelle. „Thank you“, „Okay“, „cool“ und spätere Raumkommentare wurden verworfen.
- DE-Reihenfolge am Ende: `training → handoff → cta`.
- EN-Reihenfolge am Ende: `training → cta → handoff`.
- Alle EDL-Grenzen liegen auf 25-fps-Quellframes. Die Ausgabe läuft mit 30 fps und ganzzahligen Szenenframes.

## Validierung

- Remotion-Typecheck erfolgreich
- Anwendung-Typecheck erfolgreich
- ESLint erfolgreich
- 333 Unit-Tests erfolgreich
- 14 Smoke-Suiten erfolgreich
- Functions-Abhängigkeiten nach Lockfile installiert; Functions-Typecheck und Functions-Build erfolgreich
- Next.js-Produktionsbuild erfolgreich
- Kontaktbögen beider Finalvideos geprüft: Gesicht bleibt vollständig im Oval; PiP und Folieninhalt kollidieren nicht
- Hero-Screenshots für DE/EN bei 1440 × 1000 und 390 × 844 geprüft: Zitat, Prof. Dr. Janine Wendt und vollständige Funktion bleiben im ersten Viewport
- MP4- und WebM-Dauer, Auflösung, Framerate, Audioformat und SHA-256 geprüft

Der lokale `npm test`-Wrapper kollidierte im langen Worktree-Pfad mit der macOS-Längenbegrenzung für Unix-Sockets. Die identische Unit- und Smoke-Testmenge wurde deshalb mit kurzem `TMPDIR` direkt über das repo-lokale `tsx` ausgeführt und vollständig bestanden. GitHub CI arbeitet in einem kürzeren Checkout-Pfad.

`npm --prefix functions ci` meldet 22 bereits im Lockfile vorhandene Audit-Hinweise. Dieser Release ändert keine Functions-Abhängigkeit und verschlechtert den bestehenden Produktionsstand nicht; die Aktualisierung bleibt ein eigener Dependency-Slice.

## Veröffentlichung und Abnahme

Die Veröffentlichung erfolgt über einen fokussierten Pull Request aus einem `codex/*`-Branch. Nach grüner GitHub-CI und grünem Netlify-Preview wird in `main` gemergt. Anschließend werden `https://kiregister.com/de` und `https://kiregister.com/en` einschließlich Hero, Player, Untertiteln und Medienantworten live geprüft.

## Rollback

Den Release-PR über einen neuen Pull Request revertieren. Netlify veröffentlicht anschließend wieder die vorherigen Medien und den vorherigen Hero. Falls die Website unmittelbar beeinträchtigt ist, kann zuerst der letzte erfolgreiche `studio-egonso`-Deploy wiederhergestellt und danach `main` durch den Revert-PR abgeglichen werden.
