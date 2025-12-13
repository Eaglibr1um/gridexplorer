import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Using the publishable key for client-side access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aenzdgnuscszdgipuyea.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6ilTS_trs86n9kSSlvN2Iw_H0ujXZwu';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

