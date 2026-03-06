import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  if (initPromise) return initPromise;

  initPromise = fetch("/api/config")
    .then((r) => r.json())
    .then(({ supabaseUrl, supabaseAnonKey }) => {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "lv_auth",
        },
      });
      return supabaseInstance;
    });

  return initPromise;
}

export function getSupabaseSync(): SupabaseClient | null {
  return supabaseInstance;
}
