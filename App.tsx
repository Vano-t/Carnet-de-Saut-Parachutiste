import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { JumpHistory } from './components/JumpHistory';
import { AddJump } from './components/AddJump';
import { ScanJump } from './components/ScanJump';
import { UserProfile } from './components/UserProfile';
import { WeatherMap } from './components/WeatherMap';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Plane, History, Camera, User, Map, LogOut } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';

function AuthenticatedApp() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Carnet de Saut</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Bienvenue, {user.name}
              </span>
              <span className="text-xs text-gray-500">
                Licence #{user.license}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Nouveau Saut
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Carte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <JumpHistory />
          </TabsContent>
          
          <TabsContent value="add">
            <AddJump />
          </TabsContent>
          
          <TabsContent value="scan">
            <ScanJump />
          </TabsContent>
          
          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>
          
          <TabsContent value="map">
            <WeatherMap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}