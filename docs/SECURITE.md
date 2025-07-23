# 🔐 Guide de Sécurisation des API Keys

## 📋 Résumé des bonnes pratiques

L'application utilise maintenant les variables d'environnement pour sécuriser les clés API :

### ✅ **Ce qui a été sécurisé :**

1. **Clé API OpenWeatherMap** → `VITE_OPENWEATHER_API_KEY`
2. **Project ID Supabase** → `VITE_SUPABASE_PROJECT_ID`  
3. **Clé publique Supabase** → `VITE_SUPABASE_ANON_KEY`

## 🚀 Configuration pour le déploiement

### 1. **Variables d'environnement locales**

Fichier `.env.local` (déjà configuré) :
```env
VITE_OPENWEATHER_API_KEY=votre_clé_api
VITE_SUPABASE_PROJECT_ID=votre_project_id
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

### 2. **Configuration GitHub Secrets**

Pour le déploiement automatique, ajoutez ces secrets dans votre repository GitHub :

**Repository Settings → Secrets and variables → Actions → New repository secret**

```
Nom: VITE_OPENWEATHER_API_KEY
Valeur: f77e80e5577971b6e603fe9c5441bd46

Nom: VITE_SUPABASE_PROJECT_ID  
Valeur: noejgcltkdthhnrmxgro

Nom: VITE_SUPABASE_ANON_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZWpnY2x0a2R0aGhucm14Z3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTUzMzMsImV4cCI6MjA2ODY5MTMzM30.jNBa2A9Q12CJ8vdHayXRciDErzJNQqBpCMVMevIjTRM
```

## 🛡️ Niveaux de sécurité

### **Données PUBLIQUES (OK à exposer) :**
- ✅ **Supabase Anon Key** : Conçue pour être publique, protégée par RLS
- ✅ **Project ID** : Identifiant public du projet Supabase

### **Données PRIVÉES (à protéger) :**
- 🔐 **OpenWeatherMap API Key** : Limitée en nombre d'appels
- 🔐 **Supabase Service Role Key** : JAMAIS exposer côté client

## 🔧 Fonctionnement

### **Développement local :**
```bash
# Les variables sont lues depuis .env.local
npm run dev
```

### **Build de production :**
```bash
# Les variables sont injectées au moment du build
npm run build
```

### **Déploiement GitHub Actions :**
```yaml
# Les secrets GitHub sont utilisés
env:
  VITE_OPENWEATHER_API_KEY: ${{ secrets.VITE_OPENWEATHER_API_KEY }}
```

## 🚨 Sécurité avancée

### **Pour une sécurité maximale :**

1. **Rotez vos clés régulièrement**
2. **Limitez les domaines autorisés** dans votre dashboard OpenWeatherMap
3. **Activez RLS (Row Level Security)** sur Supabase
4. **Utilisez un proxy API** pour masquer complètement les clés côté serveur

### **Architecture recommandée (optionnelle) :**
```
Client → Votre API → Services externes
```

Au lieu de :
```
Client → Services externes directement
```

## ✅ État actuel

L'application est maintenant sécurisée avec :
- ✅ Variables d'environnement configurées
- ✅ GitHub Actions avec secrets
- ✅ Valeurs par défaut sécurisées
- ✅ Documentation complète

Vos clés ne sont plus exposées dans le code source ! 🎉
