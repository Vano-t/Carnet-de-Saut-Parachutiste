import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { projectId } from '../utils/supabase/info';
import { toast } from "sonner";

export interface Jump {
  id: string;
  jumpNumber: number;
  date: string;
  location: string;
  aircraft: string;
  altitude: number;
  canopySize?: number;
  weather?: string;
  wind?: string;
  freefallNotes?: string;
  canopyNotes?: string;
  created_at: string;
}

export function useJumps() {
  const { session } = useAuth();
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJumps = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/jumps`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJumps(data.jumps || []);
      } else {
        console.error('Failed to fetch jumps');
        toast.error('Erreur lors du chargement des sauts');
      }
    } catch (error) {
      console.error('Failed to fetch jumps:', error);
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const addJump = async (jumpData: Omit<Jump, 'id' | 'jumpNumber' | 'created_at'>) => {
    if (!session?.access_token) return false;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/jumps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jumpData)
      });

      if (response.ok) {
        const data = await response.json();
        setJumps(prev => [data.jump, ...prev]);
        toast.success('Saut ajouté avec succès !');
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erreur lors de l\'ajout du saut');
        return false;
      }
    } catch (error) {
      console.error('Failed to add jump:', error);
      toast.error('Erreur réseau');
      return false;
    }
  };

  const deleteJump = async (jumpId: string) => {
    if (!session?.access_token) return false;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1cedc7d9/jumps/${jumpId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setJumps(prev => prev.filter(jump => jump.id !== jumpId));
        toast.success('Saut supprimé');
        return true;
      } else {
        toast.error('Erreur lors de la suppression');
        return false;
      }
    } catch (error) {
      console.error('Failed to delete jump:', error);
      toast.error('Erreur réseau');
      return false;
    }
  };

  useEffect(() => {
    fetchJumps();
  }, [session?.access_token]);

  return {
    jumps,
    loading,
    addJump,
    deleteJump,
    refetch: fetchJumps
  };
}