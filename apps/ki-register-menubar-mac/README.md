# KI-Register MenuBar App (macOS)

Native Menüleisten-App für macOS, um `Quick Capture` jederzeit direkt neben WLAN/Batterie zu öffnen.

## Features

- Läuft als Menüleisten-App (ohne Dock-Icon, `LSUIElement`).
- Öffnet `/capture` direkt in einem eingebetteten WebView.
- Feste Standard-Domain: `https://kiregister.com`.
- Login-Prüfung im Capture-Flow, alternativ Gastmodus mit lokaler Speicherung.

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
5. Falls weiter blockiert:
   - `xattr -dr com.apple.quarantine /Applications/KI-Register-MenuBar.app`
6. Nach dem Start erscheint das Icon in der macOS-Menüleiste.

## Hinweis für produktiven Rollout

Für reibungslose Installation auf fremden Macs sollte die App mit Apple Developer Zertifikat signiert und notarisiert werden.

### Optional: signieren + notarisieren im Build-Skript

Das Build-Skript unterstützt optionale Variablen:

- `MACOS_SIGN_IDENTITY` (z. B. `Developer ID Application: ...`)
- `MACOS_NOTARY_PROFILE` (Keychain-Profil für `xcrun notarytool`)

Beispiel:

```bash
MACOS_SIGN_IDENTITY="Developer ID Application: Example GmbH (TEAMID1234)" \
MACOS_NOTARY_PROFILE="kiregister-notary" \
./scripts/build-release.sh
```
