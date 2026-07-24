import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env
// If the variables in .env lack the VITE_ prefix, Vite won't expose them to the browser automatically,
// so we'll fallback to the string constants to ensure it works instantly, or you can rename them in .env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
