import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://itldiebzzxjotounqzez.supabase.co';
export const supabaseAnonKey = 'sb_publishable_eR8SLoYX036b8cqrBo-WaA_OCy5Rm5n';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

export function terminateAndResetAllConnections() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("CUSTOM_SUPABASE_URL");
    localStorage.removeItem("CUSTOM_SUPABASE_ANON_KEY");
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        localStorage.removeItem(key);
      }
    }
  }
}

export function clearSupabaseSessionCache() {
  if (typeof window !== "undefined") {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") || key.startsWith("supabase.auth.") || key.includes("auth-token")) {
        localStorage.removeItem(key);
      }
    }
  }
}

/**
 * Creates a throwaway Supabase client for one-off signUp calls (e.g. an admin
 * creating a new customer account). We deliberately use a fresh client so the
 * signUp call does NOT overwrite the currently logged-in admin's session on
 * the shared `supabase` client above (persistSession/detectSessionInUrl off).
 */
export function createIsolatedAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

const APP_STATE_KEYS = [
  "models", "bom_items", "inventory", "logistics",
  "production", "financials", "fabric_color_archives",
  "financial_transactions", "custom_cost_lines", "profiles"
] as const;

/** Loads every app_state row and reassembles it into the same shape the old /api/data endpoint returned. */
export async function loadAppState(): Promise<Record<string, any[]>> {
  const { data, error } = await supabase.from("app_state").select("key, value");
  if (error) throw error;
  const result: Record<string, any[]> = {};
  for (const k of APP_STATE_KEYS) result[k] = [];
  (data || []).forEach((row: any) => {
    if (row.key) result[row.key] = row.value || [];
  });
  return result;
}

/** Upserts only the keys that changed (mirrors the old /api/save-state behaviour, one row per key). */
export async function saveAppState(updates: Record<string, any>): Promise<void> {
  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("app_state").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
