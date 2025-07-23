# Carnet de Saut Parachutiste 🪂

Application de gestion de carnet de saut parachutiste avec système météo intégré.

## 🚀 Déploiement sur GitHub Pages

### Configuration automatique

L'application est configurée pour un déploiement automatique sur GitHub Pages via GitHub Actions.

### Étapes de déploiement :

1. **Pusher le code sur GitHub :**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Activer GitHub Pages dans les paramètres du repository :**
   - Aller dans Settings → Pages
   - Source : "GitHub Actions"
   - L'action se déclenchera automatiquement

3. **L'application sera disponible à :**
   ```
   https://[votre-username].github.io/Carnet-de-Saut-Parachutiste/
   ```

### Déploiement manuel (optionnel)

Si vous préférez déployer manuellement :

```bash
# Build de production
npm run build

# Déploiement manuel avec gh-pages
npm run deploy
```

## 🌦️ Fonctionnalités météo

- **Données météo en temps réel** via OpenWeatherMap API
- **Évaluation de sécurité** pour le parachutisme
- **Carte interactive** avec centres de parachutisme
- **Système de favoris** et filtres avancés

## 🛠️ Développement

```bash
# Installation des dépendances
npm install

# Serveur de développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Vérification TypeScript
npm run type-check
```

## 📱 Technologies utilisées

- **React 18** + **TypeScript**
- **Vite** pour le build
- **Tailwind CSS** + **shadcn/ui**
- **Leaflet** pour la cartographie
- **OpenWeatherMap API** pour la météo
- **Supabase** pour l'authentification et les données
- **GitHub Actions** pour le déploiement

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` :

```env
# OpenWeatherMap API Key
NEXT_PUBLIC_OPENWEATHER_API_KEY=votre_clé_api

# Supabase (si nécessaire)
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_supabase
```

### Base URL pour GitHub Pages

La configuration est déjà faite dans `vite.config.ts` :

```typescript
export default defineConfig({
  base: '/Carnet-de-Saut-Parachutiste/',
  // ...
})
```

## 📊 Système d'évaluation météo

### Niveaux de sécurité :
- 🟢 **Excellent** : Conditions parfaites
- 🔵 **Bon** : Conditions favorables
- 🟡 **Modéré** : Précautions requises
- 🟠 **Difficile** : Expérience nécessaire
- 🔴 **Dangereux** : Non recommandé

### Critères d'évaluation :
- **Vitesse du vent** (facteur principal)
- **Visibilité**
- **Conditions météorologiques**
- **Pression atmosphérique**

## 🚀 Prêt pour la production !

L'application est maintenant configurée et prête pour être déployée sur GitHub Pages avec :

- ✅ Configuration Vite optimisée
- ✅ Workflow GitHub Actions
- ✅ Build de production testé
- ✅ Base URL configurée
- ✅ Système météo intégré
- ✅ Interface responsive

Poussez simplement votre code sur GitHub et l'application sera automatiquement déployée ! 🎉
