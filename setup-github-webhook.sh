#!/bin/bash
# GitHub Webhook Setup für automatische Netlify Deployments

echo "🔗 GitHub Webhook Setup für automatische Deployments"
echo ""
echo "Build Hook URL: https://api.netlify.com/build_hooks/6947be8d7a96d9c1c7a8e55d"
echo ""
echo "Um automatische Deployments bei jedem Push zu aktivieren:"
echo ""
echo "OPTION 1: GitHub Webhook einrichten (empfohlen)"
echo "─────────────────────────────────────────────────"
echo "1. Gehen Sie zu: https://github.com/Egonso/studio/settings/hooks"
echo "2. Klicken Sie auf 'Add webhook'"
echo "3. Fügen Sie folgende Daten ein:"
echo "   - Payload URL: https://api.netlify.com/build_hooks/6947be8d7a96d9c1c7a8e55d"
echo "   - Content type: application/json"
echo "   - Which events: 'Just the push event'"
echo "   - Active: ✓"
echo "4. Klicken Sie auf 'Add webhook'"
echo ""
echo "OPTION 2: Netlify Dashboard (einfacher, empfohlen)"
echo "────────────────────────────────────────────────────"
echo "1. Gehen Sie zu: https://app.netlify.com/projects/studio-egonso"
echo "2. Site settings → Build & deploy → Continuous Deployment"
echo "3. Klicken Sie auf 'Link to Git provider'"
echo "4. Wählen Sie GitHub und autorisieren Sie Netlify"
echo "5. Wählen Sie das Repository: Egonso/studio"
echo "6. Branch: main"
echo "7. Build command: npm run build"
echo "8. Publish directory: .next"
echo "9. Klicken Sie auf 'Save'"
echo ""
echo "Nach der Einrichtung wird bei jedem Push in 'main' automatisch deployed! 🚀"




