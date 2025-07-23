import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useAuth } from '../hooks/useAuth';
import { useJumps } from '../hooks/useJumps';
import { projectId } from '../utils/supabase/info';
import { User, Award, Calendar, MapPin, Plane, Settings, Edit, RefreshCw } from 'lucide-react';

interface UserStats {
  totalJumps: number;
  totalAltitude: number;
  totalFreefall: string;
  favoriteDropzone: string;
}

export function UserProfile() {
  const { user, session } = useAuth();
  const { jumps } = useJumps();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserStats = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.profile.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [session?.access_token, jumps.length]);

  if (!user) return null;

  const joinDate = user.joinDate ? new Date(user.joinDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long'
  }) : 'Non défini';

  const achievements = [
    { name: "Premier saut", icon: "🪂", date: jumps.length > 0 ? new Date(jumps[jumps.length - 1].date).toLocaleDateString('fr-FR') : 'N/A' },
    { name: "Membre actif", icon: "⭐", date: joinDate },
    { name: "Carnet numérique", icon: "📱", date: "Aujourd'hui" }
  ];

  // Add dynamic achievements based on jump count
  if (jumps.length >= 5) {
    achievements.push({ name: "5 sauts accomplis", icon: "🏆", date: "Récent" });
  }
  if (jumps.length >= 10) {
    achievements.push({ name: "Parachutiste confirmé", icon: "🥇", date: "Récent" });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mon profil</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUserStats()}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-gray-600">Licence #{user.license}</p>
                <Badge variant="outline" className="mt-2">
                  Parachutiste
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Membre depuis</div>
                    <div className="font-medium">{joinDate}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Dernier centre</div>
                    <div className="font-medium">
                      {jumps.length > 0 ? jumps[0].location : 'Aucun saut'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Plane className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Dernier aéronef</div>
                    <div className="font-medium">
                      {jumps.length > 0 ? jumps[0].aircraft : 'Aucun saut'}
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.totalJumps || jumps.length}
                    </div>
                    <div className="text-sm text-gray-600">Sauts totaux</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.totalFreefall || `${Math.floor(jumps.length * 70 / 60)}m ${(jumps.length * 70) % 60}s`}
                    </div>
                    <div className="text-sm text-gray-600">Temps de chute</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {((stats?.totalAltitude || jumps.reduce((sum, jump) => sum + jump.altitude, 0)) / 1000).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Altitude (km)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(jumps.map(jump => jump.location)).size}
                    </div>
                    <div className="text-sm text-gray-600">Centres visités</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="secondary">Élève</Badge>
                {jumps.length >= 5 && <Badge variant="secondary">PAC</Badge>}
                {jumps.length >= 15 && <Badge variant="secondary">BPA</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Réussites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-gray-600">{achievement.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Préférences de notification
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Confidentialité
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <User className="h-4 w-4 mr-2" />
                Supprimer le compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}