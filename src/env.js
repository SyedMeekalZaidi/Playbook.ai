// Simple environment variable validation
const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate required environment variables
Object.entries(env).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
});

export default env;
