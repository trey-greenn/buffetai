// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// Load environment variables when running with ts-node
// dotenv.config({ path: '.env.local' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials:', { 
      url: supabaseUrl ? 'defined' : 'missing', 
      key: supabaseAnonKey ? 'defined' : 'missing' 
    });
  }
export const supabase = createClient(supabaseUrl, supabaseAnonKey);