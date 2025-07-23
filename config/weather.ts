// Configuration pour l'API météo
export const WEATHER_CONFIG = {
  // Clé API récupérée depuis les variables d'environnement
  // En production, utilisez les secrets GitHub ou variables d'environnement du serveur
  API_KEY: (import.meta as any).env?.VITE_OPENWEATHER_API_KEY || 'demo_key_not_for_production',
  
  // URL de base de l'API
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  
  // Paramètres par défaut
  DEFAULT_PARAMS: {
    units: 'metric', // Utiliser les unités métriques
    lang: 'fr',     // Langue française
  },
  
  // Limites pour l'évaluation de sécurité du parachutisme
  SAFETY_LIMITS: {
    WIND_SPEED: {
      EXCELLENT: 10,    // km/h
      GOOD: 15,
      MODERATE: 25,
      POOR: 35,
    },
    VISIBILITY: {
      EXCELLENT: 10,    // km
      GOOD: 8,
      MODERATE: 5,
      POOR: 2,
    }
  }
};

// Types pour les données météo
export interface WeatherData {
  temperature: number;
  wind: string;
  visibility: string;
  conditions: string;
  pressure?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  safetyLevel?: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
}

// Interface pour la réponse de l'API OpenWeatherMap
export interface OpenWeatherResponse {
  main: {
    temp: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    main: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
}
