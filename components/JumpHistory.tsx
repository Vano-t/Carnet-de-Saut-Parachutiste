import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useJumps, Jump } from '../hooks/useJumps';
import { Wind, MapPin, Plane, Calendar, Eye, CloudSun, Trash2, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

export function JumpHistory() {
  const { jumps, loading, deleteJump, refetch } = useJumps();
  const [selectedJump, setSelectedJump] = useState<Jump | null>(null);

  const totalJumps = jumps.length;
  const totalAltitude = jumps.reduce((sum, jump) => sum + jump.altitude, 0);

  const handleDeleteJump = async (jump: Jump) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le saut #${jump.jumpNumber} ?`)) {
      await deleteJump(jump.id);
      if (selectedJump?.id === jump.id) {
        setSelectedJump(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des sauts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historique des sauts</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sauts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalJumps}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Altitude Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalAltitude.toLocaleString()} m
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dernier Saut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {jumps[0]?.date || 'Aucun'}
            </div>
          </CardContent>
        </Card>
      </div>

      {jumps.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucun saut enregistré</p>
              <p>Commencez par ajouter votre premier saut !</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {jumps.map((jump) => (
              <Card 
                key={jump.id}
                className={`cursor-pointer transition-all ${
                  selectedJump?.id === jump.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedJump(jump)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Saut #{jump.jumpNumber}</Badge>
                        <span className="text-sm text-gray-600">{new Date(jump.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {jump.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Plane className="h-3 w-3" />
                          {jump.aircraft}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">{jump.altitude}m</div>
                        {jump.canopySize && (
                          <div className="text-sm text-gray-600">{jump.canopySize} ft²</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJump(jump);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {(jump.weather || jump.wind) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {jump.weather && (
                        <div className="flex items-center gap-1">
                          <CloudSun className="h-3 w-3" />
                          {jump.weather}
                        </div>
                      )}
                      {jump.wind && (
                        <div className="flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          {jump.wind}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            {selectedJump ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Détails du saut #{selectedJump.jumpNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(selectedJump.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lieu</label>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {selectedJump.location}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Aéronef</label>
                      <div className="flex items-center gap-1 mt-1">
                        <Plane className="h-4 w-4 text-gray-400" />
                        {selectedJump.aircraft}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Altitude</label>
                      <div className="mt-1">{selectedJump.altitude} m</div>
                    </div>
                    {selectedJump.canopySize && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Taille voile</label>
                        <div className="mt-1">{selectedJump.canopySize} ft²</div>
                      </div>
                    )}
                    {selectedJump.wind && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vent</label>
                        <div className="flex items-center gap-1 mt-1">
                          <Wind className="h-4 w-4 text-gray-400" />
                          {selectedJump.wind}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedJump.weather && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Météo</label>
                      <div className="flex items-center gap-1 mt-1">
                        <CloudSun className="h-4 w-4 text-gray-400" />
                        {selectedJump.weather}
                      </div>
                    </div>
                  )}

                  {selectedJump.freefallNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Observations en chute libre</label>
                      <div className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                        {selectedJump.freefallNotes}
                      </div>
                    </div>
                  )}

                  {selectedJump.canopyNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Observations sous voile</label>
                      <div className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                        {selectedJump.canopyNotes}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteJump(selectedJump)}
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer ce saut
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-6">
                <CardContent className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un saut pour voir les détails</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}