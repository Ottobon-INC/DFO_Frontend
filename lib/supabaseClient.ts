import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env
// If the variables in .env lack the VITE_ prefix, Vite won't expose them to the browser automatically,
// so we'll fallback to the string constants to ensure it works instantly, or you can rename them in .env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kaaxkycrhkefylynkupy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthYXhreWNyaGtlZnlseW5rdXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMjY4OTEsImV4cCI6MjA5NjgwMjg5MX0.pnSz13BJ09_uADk6Cyoubmhm8TWUbBW18X9yr1VZqz0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
