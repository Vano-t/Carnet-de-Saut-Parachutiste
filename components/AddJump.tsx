import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useJumps } from '../hooks/useJumps';
import { Plus, Save, MapPin, Plane, Wind, CloudSun } from 'lucide-react';
import { toast } from "sonner";

const aircraftTypes = [
  "Cessna 182",
  "Cessna 206",
  "Pilatus Porter",
  "PAC 750 XL",
  "Twin Otter",
  "King Air",
  "Caravan",
  "Islander"
];

const dropzones = [
  // Principales destinations par région
  "Bourg-en-Bresse", "Tallard", "Grenoble", "Saint-Étienne", "Annecy",
  "Pau", "Bordeaux", "Limoges", "La Rochelle", "Biscarrosse",
  "Cahors", "Toulouse", "Montpellier", "Perpignan", "Albi",
  "Saumur", "Nantes", "Le Mans", "Cholet",
  "Vannes", "Rennes", "Brest", "Quimper",
  "Caen", "Rouen", "Cherbourg",
  "Lille", "Amiens", "Calais",
  "Strasbourg", "Mulhouse", "Metz", "Reims",
  "Orléans", "Tours", "Châteauroux",
  "Meaux", "Lognes", "Coulommiers",
  "Dijon", "Besançon",
  "Marseille", "Nice", "Toulon", "Avignon",
  "Ajaccio", "Bastia",
  "Fort-de-France", "Pointe-à-Pitre", "Saint-Denis"
].sort();

export function AddJump() {
  const { addJump } = useJumps();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    aircraft: '',
    altitude: '',
    canopySize: '',
    weather: '',
    wind: '',
    freefallNotes: '',
    canopyNotes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.location || !formData.aircraft || !formData.altitude) {
      toast.error("Veuillez remplir les champs obligatoires (lieu, aéronef, altitude)");
      return;
    }

    const altitude = parseInt(formData.altitude);
    if (isNaN(altitude) || altitude <= 0) {
      toast.error("L'altitude doit être un nombre positif");
      return;
    }

    const canopySize = formData.canopySize ? parseInt(formData.canopySize) : undefined;
    if (formData.canopySize && (isNaN(canopySize!) || canopySize! <= 0)) {
      toast.error("La taille de voile doit être un nombre positif");
      return;
    }

    setIsSubmitting(true);

    const jumpData = {
      date: formData.date,
      location: formData.location,
      aircraft: formData.aircraft,
      altitude,
      canopySize,
      weather: formData.weather || undefined,
      wind: formData.wind || undefined,
      freefallNotes: formData.freefallNotes || undefined,
      canopyNotes: formData.canopyNotes || undefined
    };

    const success = await addJump(jumpData);
    
    if (success) {
      // Reset du formulaire
      setFormData({
        date: new Date().toISOString().split('T')[0],
        location: '',
        aircraft: '',
        altitude: '',
        canopySize: '',
        weather: '',
        wind: '',
        freefallNotes: '',
        canopyNotes: ''
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouveau saut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informations du saut</h3>
                
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Lieu de saut *</Label>
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => handleInputChange('location', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un centre de saut" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropzones.map((dz) => (
                        <SelectItem key={dz} value={dz}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {dz}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="aircraft">Aéronef *</Label>
                  <Select 
                    value={formData.aircraft} 
                    onValueChange={(value) => handleInputChange('aircraft', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un aéronef" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraftTypes.map((aircraft) => (
                        <SelectItem key={aircraft} value={aircraft}>
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4" />
                            {aircraft}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="altitude">Altitude de largage (m) *</Label>
                    <Input
                      id="altitude"
                      type="number"
                      placeholder="Ex: 4000"
                      value={formData.altitude}
                      onChange={(e) => handleInputChange('altitude', e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="canopySize">Taille voile (ft²)</Label>
                    <Input
                      id="canopySize"
                      type="number"
                      placeholder="Ex: 230"
                      value={formData.canopySize}
                      onChange={(e) => handleInputChange('canopySize', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Conditions météo</h3>
                
                <div>
                  <Label htmlFor="weather">Météo</Label>
                  <div className="relative">
                    <CloudSun className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="weather"
                      placeholder="Ex: Ensoleillé, 20°C"
                      className="pl-10"
                      value={formData.weather}
                      onChange={(e) => handleInputChange('weather', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="wind">Vent</Label>
                  <div className="relative">
                    <Wind className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="wind"
                      placeholder="Ex: 8 kt SO"
                      className="pl-10"
                      value={formData.wind}
                      onChange={(e) => handleInputChange('wind', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="freefallNotes">Observations en chute libre</Label>
                  <Textarea
                    id="freefallNotes"
                    placeholder="Décrivez votre ressenti, position, manœuvres effectuées..."
                    rows={4}
                    value={formData.freefallNotes}
                    onChange={(e) => handleInputChange('freefallNotes', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="canopyNotes">Observations sous voile</Label>
                  <Textarea
                    id="canopyNotes"
                    placeholder="Pilotage, approche, atterrissage..."
                    rows={4}
                    value={formData.canopyNotes}
                    onChange={(e) => handleInputChange('canopyNotes', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    location: '',
                    aircraft: '',
                    altitude: '',
                    canopySize: '',
                    weather: '',
                    wind: '',
                    freefallNotes: '',
                    canopyNotes: ''
                  });
                }}
              >
                Réinitialiser
              </Button>
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer le saut
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}