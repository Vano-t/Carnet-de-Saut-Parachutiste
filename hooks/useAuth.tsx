import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  name: string;
  license: string;
  email: string;
  totalJumps?: number;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (license: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, license: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Fetch user profile from server
        fetchUserProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.access_token);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (license: string, password: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/auth/signin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ license, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Sign in failed' };
      }

      // Set the session manually since we're using custom auth
      setSession(data.session);
      setUser(data.user);
      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, name: string, license: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/auth/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name, license })
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Sign up failed' };
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Network error' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}