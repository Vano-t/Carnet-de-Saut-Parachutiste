import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from '../hooks/useAuth';
import { Plane, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

export function LoginForm() {
  const { signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [signInData, setSignInData] = useState({
    license: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    license: '',
    password: '',
    confirmPassword: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInData.license || !signInData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    // Validate license number format
    if (!/^\d{6,}$/.test(signInData.license)) {
      toast.error("Format de numéro de licence invalide");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInData.license, signInData.password);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success("Connexion réussie !");
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpData.name || !signUpData.email || !signUpData.license || !signUpData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    // Validate license number format (should be numeric and at least 6 digits)
    if (!/^\d{6,}$/.test(signUpData.license)) {
      toast.error("Le numéro de licence doit contenir au moins 6 chiffres");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (signUpData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.name, signUpData.license);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      // Reset form
      setSignUpData({
        name: '',
        email: '',
        license: '',
        password: '',
        confirmPassword: ''
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Plane className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Carnet de Saut</h1>
          <p className="text-gray-600 mt-2">Suivez votre progression en parachutisme</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Accès à votre carnet</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="license">Numéro de licence</Label>
                    <Input
                      id="license"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Ex: 123456789"
                      value={signInData.license}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        setSignInData(prev => ({ ...prev, license: value }));
                      }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Connexion...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Se connecter
                      </div>
                    )}
                  </Button>
                </form>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Première visite ?</p>
                      <p>Créez votre compte avec votre email et votre numéro de licence. Vous pourrez ensuite vous connecter avec votre numéro de licence.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="jean.dupont@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-license">Numéro de licence</Label>
                    <Input
                      id="signup-license"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Ex: 123456789"
                      value={signUpData.license}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        setSignUpData(prev => ({ ...prev, license: value }));
                      }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Création...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Créer mon compte
                      </div>
                    )}
                  </Button>
                </form>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Note importante</p>
                      <p>Votre numéro de licence sera utilisé pour vous connecter. Assurez-vous qu'il soit correct et qu'il contienne au moins 6 chiffres.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}