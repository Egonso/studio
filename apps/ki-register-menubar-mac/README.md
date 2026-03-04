# KI-Register MenuBar App (macOS)

Native Menüleisten-App für macOS, um `Quick Capture` jederzeit direkt neben WLAN/Batterie zu öffnen.

## Features

- Läuft als Menüleisten-App (ohne Dock-Icon, `LSUIElement`).
- Öffnet `/capture` direkt in einem eingebetteten WebView.
- Konfigurierbare Basis-URL (z. B. `https://app.kiregister.com` oder `http://localhost:3000`).

## Build (lokal)

```bash
cd apps/ki-register-menubar-mac
./scripts/build-release.sh
```

Ergebnis:

- App Bundle: `apps/ki-register-menubar-mac/dist/KI-Register-MenuBar.app`
- ZIP für Verteilung: `apps/ki-register-menubar-mac/dist/KI-Register-MenuBar-macOS.zip`

## Installation (lokal)

1. ZIP entpacken
2. `KI-Register-MenuBar.app` in `Programme` ziehen
3. App starten
4. Beim ersten Start ggf. Rechtsklick -> `Öffnen`
   - Hintergrund: Die App ist ad-hoc signiert, nicht notarisiert.

## Hinweis für produktiven Rollout

Für reibungslose Installation auf fremden Macs sollte die App mit Apple Developer Zertifikat signiert und notarisiert werden.
