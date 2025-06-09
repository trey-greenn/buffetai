// src/config/env.ts
export const ENV = {
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    // Add other environment variables here
  };
  
  // Validate required env vars
  const requiredEnvVars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
  for (const key of requiredEnvVars) {
    if (!ENV[key as keyof typeof ENV]) {
      console.warn(`Missing required environment variable: ${key}`);
    }
  }