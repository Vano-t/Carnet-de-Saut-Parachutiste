#!/bin/bash

# Script de déploiement pour GitHub Pages
# Utilisation: ./deploy.sh

echo "🚀 Déploiement de l'application Carnet de Saut Parachutiste"

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Build de l'application
echo "📦 Build de l'application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "✅ Build réussi !"

# Déploiement sur GitHub Pages
echo "🌐 Déploiement sur GitHub Pages..."
npm run deploy

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du déploiement"
    exit 1
fi

echo "🎉 Déploiement réussi !"
echo "📱 L'application sera disponible à l'adresse :"
echo "   https://[votre-username].github.io/Carnet-de-Saut-Parachutiste/"
echo ""
echo "⏳ Il peut y avoir un délai de quelques minutes avant que les changements soient visibles."
