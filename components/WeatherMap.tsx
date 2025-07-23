import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuth } from '../hooks/useAuth';
import { projectId } from '../utils/supabase/info';
import { WEATHER_CONFIG, WeatherData, OpenWeatherResponse } from '../config/weather';
import { 
  Map, 
  MapPin, 
  Wind, 
  CloudSun, 
  Thermometer, 
  Eye, 
  Phone, 
  Globe,
  Navigation,
  AlertTriangle,
  Heart,
  Search,
  Filter,
  Star,
  RefreshCw
} from 'lucide-react';
import { toast } from "sonner";

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;

interface DropZone {
  id: string;
  name: string;
  city: string;
  region: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  website: string;
  aircraft: string[];
  maxAltitude: number;
  status: 'open' | 'closed' | 'limited';
  weather?: {
    temperature: number;
    wind: string;
    visibility: string;
    conditions: string;
    pressure?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    safetyLevel?: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
  };
}

export function WeatherMap() {
  const { session } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>({});
  
  const [dropzones, setDropzones] = useState<DropZone[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDz, setSelectedDz] = useState<DropZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !L) {
        try {
          L = await import('leaflet');
          // Import CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          
          setMapLoaded(true);
        } catch (error) {
          console.error('Error loading Leaflet:', error);
        }
      }
    };
    
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !mapLoaded || !L) return;

    // Initialize markersRef if not already done
    if (!markersRef.current) {
      markersRef.current = {};
    }

    try {
      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create map centered on France
      const map = L.map(mapRef.current, {
        center: [46.603354, 1.888334], // Center of France
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 5
      }).addTo(map);

      mapInstanceRef.current = map;
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Fetch dropzones and favorites
  useEffect(() => {
    fetchDropzones();
    if (session?.access_token) {
      fetchFavorites();
    }
  }, [session?.access_token]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;

    // Clear existing markers
    Object.values(markersRef.current || {}).forEach((marker: any) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    getFilteredDropzones().forEach(dz => {
      const marker = createMarker(dz);
      if (marker && mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
        markersRef.current[dz.id] = marker;
      }
    });
  }, [dropzones, searchTerm, statusFilter, regionFilter, favorites, selectedDz, mapLoaded]);

  const createMarker = (dz: DropZone) => {
    if (!L) return null;

    const color = getMarkerColor(dz.status);
    const isFavorite = favorites.includes(dz.id);
    const isSelected = selectedDz?.id === dz.id;

    // Create custom icon
    const iconHtml = `
      <div style="
        width: ${isSelected ? '24px' : '18px'}; 
        height: ${isSelected ? '24px' : '18px'}; 
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        position: relative;
        ${isSelected ? 'border-color: #3b82f6; border-width: 4px;' : ''}
      ">
        ${isFavorite ? '<div style="position: absolute; top: -8px; left: -8px; font-size: 14px;">⭐</div>' : ''}
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-div-icon',
      iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
      iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9]
    });

    const marker = L.marker([dz.coordinates.lat, dz.coordinates.lng], {
      icon: customIcon
    });

    // Create popup content
    const popupContent = createPopupContent(dz);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });

    // Add click event
    marker.on('click', () => {
      setSelectedDz(dz);
    });

    return marker;
  };

  const createPopupContent = (dz: DropZone) => {
    return `
      <div style="font-family: inherit; line-height: 1.5;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 18px; font-weight: 600; margin: 0;">${dz.name}</h3>
          <span style="background: ${getStatusBgColor(dz.status)}; color: ${getStatusTextColor(dz.status)}; 
                       padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
            ${getStatusText(dz.status)}
          </span>
        </div>
        
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">
          <div>${dz.city}, ${dz.region}</div>
          <div>Alt. max: ${dz.maxAltitude}m</div>
          <div>Aéronefs: ${dz.aircraft.length}</div>
        </div>

        ${dz.weather ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-bottom: 12px;">
            <div style="font-size: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>${getWeatherIcon(dz.weather.conditions)}</span>
                <span>${dz.weather.temperature}°C - ${dz.weather.conditions}</span>
              </div>
              <div style="color: #6b7280;">
                <div>🌬️ ${dz.weather.wind}</div>
                <div>👁️ ${dz.weather.visibility}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
          <div style="margin-bottom: 4px;">
            <a href="tel:${dz.phone}" style="color: #2563eb; text-decoration: none; font-size: 14px;">
              📞 ${dz.phone}
            </a>
          </div>
          <div style="margin-bottom: 4px;">
            <a href="https://${dz.website}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 14px;">
              🌐 ${dz.website}
            </a>
          </div>
          <div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${dz.coordinates.lat},${dz.coordinates.lng}" 
               target="_blank" style="color: #2563eb; text-decoration: none; font-size: 14px;">
              🧭 Itinéraire
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const fetchDropzones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/dropzones`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const dropzonesList = data.dropzones || [];
        
        // Récupérer les données météo pour chaque dropzone
        await updateDropzonesWithWeather(dropzonesList);
      } else {
        toast.error('Erreur lors du chargement des centres');
      }
    } catch (error) {
      console.error('Failed to fetch dropzones:', error);
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/favorites`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData | null> => {
    try {
      // Vérifier si la clé API est configurée
      if (!WEATHER_CONFIG.API_KEY || WEATHER_CONFIG.API_KEY === 'votre_clé_api_openweathermap') {
        console.warn('Clé API OpenWeatherMap non configurée. Utilisation de données fictives.');
        return generateMockWeatherData();
      }

      const response = await fetch(
        `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.DEFAULT_PARAMS.units}&lang=${WEATHER_CONFIG.DEFAULT_PARAMS.lang}`
      );

      if (response.ok) {
        const data: OpenWeatherResponse = await response.json();
        const weatherData: WeatherData = {
          temperature: Math.round(data.main.temp),
          wind: `${Math.round(data.wind.speed * 3.6)} km/h ${getWindDirection(data.wind.deg)}`,
          visibility: data.visibility ? `${Math.round(data.visibility / 1000)} km` : 'N/A',
          conditions: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
          pressure: data.main.pressure,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed * 3.6, // Conversion m/s vers km/h
          windDirection: data.wind.deg,
          safetyLevel: 'good'
        };
        
        // Ajouter l'évaluation de sécurité
        weatherData.safetyLevel = evaluateSkydivingSafety(weatherData);
        
        return weatherData;
      } else {
        console.error('Erreur API météo:', response.status);
        return generateMockWeatherData();
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return generateMockWeatherData();
    }
  };

  // Génère des données météo fictives pour les tests
  const generateMockWeatherData = (): WeatherData => {
    const conditions = ['Ensoleillé', 'Partiellement nuageux', 'Nuageux', 'Venteux'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const temperature = Math.floor(Math.random() * 25) + 5; // 5-30°C
    const windSpeed = Math.floor(Math.random() * 30) + 5; // 5-35 km/h
    
    const weatherData: WeatherData = {
      temperature,
      wind: `${windSpeed} km/h N`,
      visibility: `${Math.floor(Math.random() * 8) + 5} km`,
      conditions: randomCondition,
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed,
      windDirection: Math.floor(Math.random() * 360),
      safetyLevel: 'good'
    };

    weatherData.safetyLevel = evaluateSkydivingSafety(weatherData);
    return weatherData;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const evaluateSkydivingSafety = (weather: WeatherData): 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous' => {
    let safetyScore = 100;
    let safetyLevel: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous' = 'excellent';

    // Évaluation de la vitesse du vent (facteur le plus important)
    const windSpeedKmh = weather.windSpeed || 0;
    const windLimits = WEATHER_CONFIG.SAFETY_LIMITS.WIND_SPEED;
    
    if (windSpeedKmh > windLimits.POOR) {
      safetyScore -= 50; // Vent très fort - dangereux
    } else if (windSpeedKmh > windLimits.MODERATE) {
      safetyScore -= 30; // Vent fort - conditions difficiles
    } else if (windSpeedKmh > windLimits.GOOD) {
      safetyScore -= 15; // Vent modéré - attention requise
    } else if (windSpeedKmh > windLimits.EXCELLENT) {
      safetyScore -= 5; // Vent léger
    }

    // Évaluation de la visibilité
    const visibilityKm = parseFloat(weather.visibility) || 10;
    const visibilityLimits = WEATHER_CONFIG.SAFETY_LIMITS.VISIBILITY;
    
    if (visibilityKm < visibilityLimits.POOR) {
      safetyScore -= 40; // Très mauvaise visibilité
    } else if (visibilityKm < visibilityLimits.MODERATE) {
      safetyScore -= 25; // Visibilité réduite
    } else if (visibilityKm < visibilityLimits.GOOD) {
      safetyScore -= 10; // Visibilité moyenne
    }

    // Évaluation des conditions météo
    const conditions = weather.conditions.toLowerCase();
    if (conditions.includes('orage') || conditions.includes('tempête')) {
      safetyScore -= 60; // Conditions dangereuses
    } else if (conditions.includes('pluie forte') || conditions.includes('grêle')) {
      safetyScore -= 40; // Conditions très difficiles
    } else if (conditions.includes('pluie') || conditions.includes('bruine')) {
      safetyScore -= 20; // Conditions difficiles
    } else if (conditions.includes('brouillard')) {
      safetyScore -= 30; // Visibilité réduite
    }

    // Détermination du niveau de sécurité
    if (safetyScore >= 85) {
      safetyLevel = 'excellent';
    } else if (safetyScore >= 70) {
      safetyLevel = 'good';
    } else if (safetyScore >= 50) {
      safetyLevel = 'moderate';
    } else if (safetyScore >= 30) {
      safetyLevel = 'poor';
    } else {
      safetyLevel = 'dangerous';
    }

    return safetyLevel;
  };

  const updateDropzonesWithWeather = async (dropzonesList: DropZone[]) => {
    const updatedDropzones = await Promise.all(
      dropzonesList.map(async (dz) => {
        const weather = await fetchWeatherData(dz.coordinates.lat, dz.coordinates.lng);
        return {
          ...dz,
          weather: weather || undefined
        };
      })
    );
    setDropzones(updatedDropzones);
    setLastWeatherUpdate(new Date());
  };

  const refreshWeatherData = async () => {
    if (dropzones.length === 0) return;
    
    setWeatherLoading(true);
    try {
      await updateDropzonesWithWeather(dropzones);
      toast.success('Données météo mises à jour');
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      toast.error('Erreur lors de la mise à jour météo');
    } finally {
      setWeatherLoading(false);
    }
  };

  const toggleFavorite = async (dropzoneId: string) => {
    if (!session?.access_token) {
      toast.error('Vous devez être connecté pour gérer les favoris');
      return;
    }

    const isFavorite = favorites.includes(dropzoneId);
    const method = isFavorite ? 'DELETE' : 'POST';
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/favorites/${dropzoneId}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        if (isFavorite) {
          setFavorites(prev => prev.filter(id => id !== dropzoneId));
          toast.success('Retiré des favoris');
        } else {
          setFavorites(prev => [...prev, dropzoneId]);
          toast.success('Ajouté aux favoris');
        }
      } else {
        toast.error('Erreur lors de la mise à jour des favoris');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Erreur réseau');
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'dangerous': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyText = (level: string) => {
    switch (level) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'moderate': return 'Modéré';
      case 'poor': return 'Difficile';
      case 'dangerous': return 'Dangereux';
      default: return 'Inconnu';
    }
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'moderate': return '🟡';
      case 'poor': return '🟠';
      case 'dangerous': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'open': return '#dcfce7';
      case 'limited': return '#fef3c7';
      case 'closed': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'open': return '#166534';
      case 'limited': return '#92400e';
      case 'closed': return '#991b1b';
      default: return '#374151';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'limited': return 'Limité';
      case 'closed': return 'Fermé';
      default: return 'Inconnu';
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'open': return '#10b981';
      case 'limited': return '#f59e0b';
      case 'closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getWeatherIcon = (conditions: string) => {
    if (conditions.includes('Ensoleillé') || conditions.includes('Soleil')) return '☀️';
    if (conditions.includes('Nuageux')) return '☁️';
    if (conditions.includes('Orageux')) return '⛈️';
    if (conditions.includes('Venteux')) return '💨';
    if (conditions.includes('Pluie')) return '🌧️';
    return '🌤️';
  };

  const getFilteredDropzones = () => {
    return dropzones.filter(dz => {
      const matchesSearch = searchTerm === '' || 
        dz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dz.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dz.region.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || dz.status === statusFilter;
      const matchesRegion = regionFilter === 'all' || dz.region === regionFilter;
      
      return matchesSearch && matchesStatus && matchesRegion;
    });
  };

  const getSortedDropzones = () => {
    const filtered = getFilteredDropzones();
    
    // Separate favorites and non-favorites
    const favoriteDropzones = filtered.filter(dz => favorites.includes(dz.id));
    const nonFavoriteDropzones = filtered.filter(dz => !favorites.includes(dz.id));
    
    // Sort each group alphabetically
    favoriteDropzones.sort((a, b) => a.city.localeCompare(b.city));
    nonFavoriteDropzones.sort((a, b) => a.city.localeCompare(b.city));
    
    return [...favoriteDropzones, ...nonFavoriteDropzones];
  };

  const uniqueRegions = [...new Set(dropzones.map(dz => dz.region))].sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Centres de Parachutisme</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshWeatherData()}
            disabled={weatherLoading || dropzones.length === 0}
            className="flex items-center gap-2"
          >
            <CloudSun className={`h-4 w-4 ${weatherLoading ? 'animate-pulse' : ''}`} />
            Météo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDropzones()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Carte interactive</TabsTrigger>
          <TabsTrigger value="list">Liste des centres</TabsTrigger>
          <TabsTrigger value="weather">Météo régionale</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Carte de France - {dropzones.length} centres
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={mapRef} 
                    className="w-full h-[600px] rounded-lg border bg-gray-100"
                    style={{ minHeight: '600px' }}
                  >
                    {!mapLoaded && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-500">Chargement de la carte...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                      Ouvert ({dropzones.filter(dz => dz.status === 'open').length})
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                      Limité ({dropzones.filter(dz => dz.status === 'limited').length})
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      Fermé ({dropzones.filter(dz => dz.status === 'closed').length})
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      Favoris ({favorites.length})
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {selectedDz ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span className="text-base">{selectedDz.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(selectedDz.id)}
                          className={`${favorites.includes(selectedDz.id) ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-yellow-600'}`}
                        >
                          <Heart className={`h-4 w-4 ${favorites.includes(selectedDz.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Badge className={getStatusColor(selectedDz.status)}>
                          {getStatusText(selectedDz.status)}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Ville</div>
                        <div className="font-medium">{selectedDz.city}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Région</div>
                        <div className="font-medium">{selectedDz.region}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Altitude max</div>
                        <div className="font-medium">{selectedDz.maxAltitude}m</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Aéronefs</div>
                        <div className="font-medium">{selectedDz.aircraft.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Aéronefs disponibles</div>
                      <div className="flex gap-1 flex-wrap">
                        {selectedDz.aircraft.map((aircraft) => (
                          <Badge key={aircraft} variant="outline" className="text-xs">
                            {aircraft}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedDz.weather && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CloudSun className="h-4 w-4" />
                          Météo actuelle
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getWeatherIcon(selectedDz.weather.conditions)}</span>
                            <div>
                              <div className="font-medium">{selectedDz.weather.conditions}</div>
                              <div className="text-sm text-gray-600">
                                {selectedDz.weather.temperature}°C
                              </div>
                            </div>
                          </div>

                          {selectedDz.weather.safetyLevel && (
                            <div className="p-3 rounded-lg bg-gray-50 border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Conditions de saut</span>
                                <Badge className={getSafetyColor(selectedDz.weather.safetyLevel)}>
                                  {getSafetyIcon(selectedDz.weather.safetyLevel)} {getSafetyText(selectedDz.weather.safetyLevel)}
                                </Badge>
                              </div>
                              {selectedDz.weather.safetyLevel === 'dangerous' && (
                                <div className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Conditions non recommandées pour le parachutisme
                                </div>
                              )}
                              {selectedDz.weather.safetyLevel === 'poor' && (
                                <div className="text-xs text-orange-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Conditions difficiles - Expérience requise
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-gray-400" />
                              {selectedDz.weather.wind}
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-400" />
                              {selectedDz.weather.visibility}
                            </div>
                            {selectedDz.weather.pressure && (
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-gray-400" />
                                {selectedDz.weather.pressure} hPa
                              </div>
                            )}
                            {selectedDz.weather.humidity && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">💧</span>
                                {selectedDz.weather.humidity}% humidité
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={`tel:${selectedDz.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedDz.phone}
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={`https://${selectedDz.website}`} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          {selectedDz.website}
                        </a>
                      </Button>
                      <Button 
                        className="w-full" 
                        asChild
                      >
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDz.coordinates.lat},${selectedDz.coordinates.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Obtenir l'itinéraire
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Cliquez sur un point de la carte</p>
                      <p className="text-sm">ou sélectionnez un centre dans la liste</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par ville, nom ou région..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="limited">Limité</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {uniqueRegions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSortedDropzones().map((dz) => (
              <Card 
                key={dz.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDz?.id === dz.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                } ${favorites.includes(dz.id) ? 'border-yellow-300' : ''}`}
                onClick={() => setSelectedDz(dz)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {favorites.includes(dz.id) && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <h3 className="font-medium text-sm leading-tight">{dz.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{dz.city} - {dz.region}</p>
                      <p className="text-xs text-gray-500">Alt. max: {dz.maxAltitude}m</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(dz.id);
                        }}
                        className={`h-6 w-6 p-0 ${favorites.includes(dz.id) ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-yellow-600'}`}
                      >
                        <Heart className={`h-3 w-3 ${favorites.includes(dz.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Badge className={`${getStatusColor(dz.status)} text-xs`}>
                        {getStatusText(dz.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  {dz.weather && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-2">
                      <span>{getWeatherIcon(dz.weather.conditions)}</span>
                      <span>{dz.weather.temperature}°C</span>
                      <span>•</span>
                      <span>{dz.weather.wind}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {getSortedDropzones().length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun centre trouvé avec ces critères</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getSortedDropzones().map((dz) => (
              <Card key={dz.id} className={favorites.includes(dz.id) ? 'border-yellow-300' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {favorites.includes(dz.id) && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      <span>{dz.city}</span>
                    </div>
                    <Badge className={getStatusColor(dz.status)}>
                      {getStatusText(dz.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dz.weather ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{getWeatherIcon(dz.weather.conditions)}</span>
                        <div>
                          <div className="text-2xl font-bold">{dz.weather.temperature}°C</div>
                          <div className="text-sm text-gray-600">{dz.weather.conditions}</div>
                        </div>
                      </div>

                      {dz.weather.safetyLevel && (
                        <div className="mb-3">
                          <Badge className={getSafetyColor(dz.weather.safetyLevel)}>
                            {getSafetyIcon(dz.weather.safetyLevel)} {getSafetyText(dz.weather.safetyLevel)}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Wind className="h-4 w-4 text-gray-400" />
                          <span>Vent: {dz.weather.wind}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span>Visibilité: {dz.weather.visibility}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-gray-400" />
                          <span>Alt. max: {dz.maxAltitude}m</span>
                        </div>
                        {dz.weather.pressure && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">🔽</span>
                            <span>Pression: {dz.weather.pressure} hPa</span>
                          </div>
                        )}
                        {dz.weather.humidity && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">💧</span>
                            <span>Humidité: {dz.weather.humidity}%</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <CloudSun className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Données météo non disponibles</p>
                    </div>
                  )}

                  {dz.weather?.safetyLevel === 'dangerous' && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Conditions dangereuses
                    </div>
                  )}

                  {dz.weather?.safetyLevel === 'poor' && (
                    <div className="mt-3 p-2 bg-orange-50 rounded-lg flex items-center gap-2 text-sm text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      Conditions difficiles
                    </div>
                  )}

                  {dz.status === 'closed' && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Centre fermé
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
