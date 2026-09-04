import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Check if valid credentials have been provided in environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey !== "your-service-role-key"
  );
};

// Singleton instance of the server-side Supabase client (using service role key)
let client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
