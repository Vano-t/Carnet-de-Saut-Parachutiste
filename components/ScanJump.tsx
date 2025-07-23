import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Camera, Upload, Scan, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from "sonner";

interface ScannedJump {
  id: string;
  date: string;
  location: string;
  aircraft: string;
  altitude: number;
  canopySize: number;
  weather: string;
  wind: string;
  freefallNotes: string;
  canopyNotes: string;
  confidence: number;
}

const mockScannedData: ScannedJump[] = [
  {
    id: '1',
    date: '2024-02-15',
    location: 'Bourg-en-Bresse',
    aircraft: 'Cessna 182',
    altitude: 4000,
    canopySize: 260,
    weather: 'Nuageux 18°C',
    wind: '10 kt NO',
    freefallNotes: 'Bon saut, position stable',
    canopyNotes: 'Atterrissage précis',
    confidence: 0.85
  },
  {
    id: '2',
    date: '2024-02-20',
    location: 'Tallard',
    aircraft: 'Pilatus Porter',
    altitude: 4200,
    canopySize: 230,
    weather: 'Ensoleillé 22°C',
    wind: '5 kt SE',
    freefallNotes: 'Travail virages',
    canopyNotes: 'Bon pilotage',
    confidence: 0.92
  }
];

export function ScanJump() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<ScannedJump[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setIsScanning(true);
    
    // Simulation du traitement OCR
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setScannedResults(mockScannedData);
    setIsScanning(false);
    toast.success("Scan terminé ! Vérifiez les données détectées.");
  };

  const handleSaveJump = (jump: ScannedJump) => {
    toast.success(`Saut du ${jump.date} ajouté à votre carnet`);
    setScannedResults(prev => prev.filter(j => j.id !== jump.id));
  };

  const handleDiscardJump = (jump: ScannedJump) => {
    setScannedResults(prev => prev.filter(j => j.id !== jump.id));
    toast.info("Saut ignoré");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return CheckCircle;
    return AlertCircle;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner un carnet manuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Télécharger une photo de votre carnet</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Prenez une photo claire de la page de votre carnet de saut
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Choisir une image
                    </span>
                  </Button>
                </label>
                
                <Button 
                  onClick={handleScan}
                  disabled={!selectedImage || isScanning}
                  className="flex items-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  {isScanning ? 'Analyse en cours...' : 'Scanner'}
                </Button>
              </div>

              {selectedImage && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Image sélectionnée: {selectedImage.name}
                </div>
              )}
            </div>
          </div>

          {isScanning && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Analyse de l'image en cours...</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Reconnaissance des données de saut en cours...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {scannedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Données détectées ({scannedResults.length} saut{scannedResults.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Vérifiez attentivement les données détectées avant de les ajouter à votre carnet.
              </p>
            </div>

            {scannedResults.map((jump) => {
              const ConfidenceIcon = getConfidenceIcon(jump.confidence);
              
              return (
                <Card key={jump.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Saut du {jump.date}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getConfidenceColor(jump.confidence)}`}>
                          <ConfidenceIcon className="h-3 w-3" />
                          {Math.round(jump.confidence * 100)}% confiance
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDiscardJump(jump)}
                        >
                          Ignorer
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleSaveJump(jump)}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Lieu:</span>
                        <div className="font-medium">{jump.location}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Aéronef:</span>
                        <div className="font-medium">{jump.aircraft}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Altitude:</span>
                        <div className="font-medium">{jump.altitude}m</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Voile:</span>
                        <div className="font-medium">{jump.canopySize} ft²</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Météo:</span>
                        <div className="font-medium">{jump.weather}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Vent:</span>
                        <div className="font-medium">{jump.wind}</div>
                      </div>
                    </div>

                    {(jump.freefallNotes || jump.canopyNotes) && (
                      <div className="mt-4 space-y-2">
                        {jump.freefallNotes && (
                          <div>
                            <span className="text-gray-600 text-sm">Chute libre:</span>
                            <div className="text-sm bg-gray-50 p-2 rounded">{jump.freefallNotes}</div>
                          </div>
                        )}
                        {jump.canopyNotes && (
                          <div>
                            <span className="text-gray-600 text-sm">Sous voile:</span>
                            <div className="text-sm bg-gray-50 p-2 rounded">{jump.canopyNotes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}