#!/bin/bash

echo "🔧 Configuration de Google Indexing API"
echo "========================================"
echo ""

# Vérifier si googleapis est installé
if npm list googleapis > /dev/null 2>&1; then
    echo "✅ googleapis est déjà installé"
else
    echo "📦 Installation de googleapis..."
    npm install googleapis
fi

echo ""
echo "📋 Étapes suivantes :"
echo ""
echo "1. Suivre le guide dans scripts/GOOGLE_INDEXING_SETUP.md"
echo "2. Télécharger google-credentials.json depuis Google Cloud"
echo "3. Placer le fichier dans nextjs-app/"
echo "4. Ajouter le compte de service dans Google Search Console"
echo ""
echo "💡 Une fois configuré, utiliser :"
echo "   node scripts/submit-to-google.js"
echo ""
