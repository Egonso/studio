# GitHub Integration für automatische Deployments

## Status
✅ Netlify-Site erstellt: `studio-egonso`
✅ Projekt verlinkt
✅ Umgebungsvariable `GEMINI_API_KEY` gesetzt
✅ Build Hook erstellt

**Live URL:** https://studio-egonso.netlify.app

## Einmalige Einrichtung für automatische Deployments

Es gibt zwei Möglichkeiten, automatische Deployments einzurichten:

### OPTION 1: Netlify Dashboard (empfohlen - am einfachsten)

1. **Gehen Sie zum Netlify-Dashboard:**
   - https://app.netlify.com/projects/studio-egonso

2. **Gehen Sie zu Site settings → Build & deploy → Continuous Deployment**

3. **Klicken Sie auf "Link to Git provider"**

4. **Wählen Sie GitHub** und autorisieren Sie Netlify, auf Ihr Repository zuzugreifen

5. **Wählen Sie das Repository:** `Egonso/studio`

6. **Konfigurieren Sie die Build-Einstellungen:**
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

7. **Klicken Sie auf "Save"**

✅ **Fertig!** Netlify richtet automatisch den Webhook ein.

### OPTION 2: GitHub Webhook manuell einrichten

Falls Sie den Webhook manuell einrichten möchten:

1. **Gehen Sie zu GitHub:**
   - https://github.com/Egonso/studio/settings/hooks

2. **Klicken Sie auf "Add webhook"**

3. **Fügen Sie folgende Daten ein:**
   - **Payload URL:** `https://api.netlify.com/build_hooks/6947be8d7a96d9c1c7a8e55d`
   - **Content type:** `application/json`
   - **Which events:** `Just the push event`
   - **Active:** ✓

4. **Klicken Sie auf "Add webhook"**

✅ **Fertig!** Bei jedem Push in `main` wird automatisch deployed.

## Nach der Einrichtung

Nach der Einrichtung wird Netlify automatisch:
- ✅ Bei jedem Push in den `main` Branch deployen
- ✅ Deploy Previews für Pull Requests erstellen
- ✅ Die Umgebungsvariable `GEMINI_API_KEY` in allen Builds verwenden

## Manueller Trigger (falls nötig)

Falls Sie sofort ein Deployment triggern möchten, können Sie:

```bash
# Im Projekt-Verzeichnis
netlify deploy --prod
```

Oder im Dashboard: **Deploys** → **Trigger deploy** → **Deploy site**

## Überprüfung

Nach der Einrichtung können Sie testen:
1. Machen Sie eine kleine Änderung im Code
2. Committen und pushen Sie in den `main` Branch:
   ```bash
   git add .
   git commit -m "Test: Auto-deploy"
   git push origin main
   ```
3. Gehen Sie zum Netlify-Dashboard und sehen Sie, wie automatisch ein neues Deployment gestartet wird

