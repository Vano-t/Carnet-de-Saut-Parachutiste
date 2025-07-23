/* CONFIGURATION SÉCURISÉE SUPABASE */

// Récupération sécurisée depuis les variables d'environnement
export const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || "demo_id_not_for_production"
export const publicAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "demo_key_not_for_production"

// URL Supabase construite dynamiquement
export const supabaseUrl = `https://${projectId}.supabase.co`