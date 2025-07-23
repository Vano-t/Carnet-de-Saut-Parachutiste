# Configuration Météo - API OpenWeatherMap

Ce guide explique comment configurer l'intégration météo en temps réel pour les centres de parachutisme.

## Configuration de l'API OpenWeatherMap

### 1. Obtenir une clé API gratuite

1. Visitez [OpenWeatherMap](https://openweathermap.org/api)
2. Créez un compte gratuit
3. Accédez à votre tableau de bord
4. Générez une clé API (gratuite jusqu'à 1000 appels/jour)

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=votre_clé_api_ici
```

### 3. Configuration alternative

Vous pouvez également modifier directement le fichier `config/weather.ts` :

```typescript
export const WEATHER_CONFIG = {
  API_KEY: 'votre_clé_api_ici',
  // ... autres configurations
};
```

## Fonctionnalités météo

### Données récupérées

- **Température** : en degrés Celsius
- **Vent** : vitesse (km/h) et direction
- **Visibilité** : en kilomètres
- **Conditions** : description textuelle
- **Pression atmosphérique** : en hPa
- **Humidité** : en pourcentage

### Évaluation de sécurité

Le système évalue automatiquement les conditions de parachutisme :

#### Niveaux de sécurité

- 🟢 **Excellent** : Conditions parfaites
- 🔵 **Bon** : Conditions favorables
- 🟡 **Modéré** : Conditions acceptables avec précautions
- 🟠 **Difficile** : Conditions difficiles, expérience requise
- 🔴 **Dangereux** : Conditions non recommandées

#### Critères d'évaluation

**Vitesse du vent :**
- Excellent : < 10 km/h
- Bon : 10-15 km/h
- Modéré : 15-25 km/h
- Difficile : 25-35 km/h
- Dangereux : > 35 km/h

**Visibilité :**
- Excellent : > 10 km
- Bon : 8-10 km
- Modéré : 5-8 km
- Difficile : 2-5 km
- Dangereux : < 2 km

**Conditions météo :**
- Orages/tempêtes : Dangereux
- Pluie forte/grêle : Très difficile
- Pluie/bruine : Difficile
- Brouillard : Visibilité réduite

## Mode de développement

Sans clé API configurée, le système utilise des données météo fictives pour les tests.

## Limites

- **API gratuite** : 1000 appels/jour
- **Fréquence de mise à jour** : Les données sont mises à jour à chaque chargement de la page
- **Couverture** : Mondiale via OpenWeatherMap

## Dépannage

### Problèmes courants

1. **Pas de données météo** : Vérifiez votre clé API
2. **Erreur 401** : Clé API invalide ou expirée
3. **Erreur 429** : Limite d'appels dépassée

### Logs de débogage

Ouvrez la console du navigateur pour voir les messages de débogage météo.

## Personnalisation

Vous pouvez modifier les critères d'évaluation dans `config/weather.ts` :

```typescript
SAFETY_LIMITS: {
  WIND_SPEED: {
    EXCELLENT: 10,    // Modifiez ces valeurs
    GOOD: 15,
    MODERATE: 25,
    POOR: 35,
  },
  // ...
}
```
