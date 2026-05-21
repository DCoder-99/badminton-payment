import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase/client";
import type { Database } from "../types";

export type DbClient = SupabaseClient<Database>;

export function getSupabase(client?: DbClient) {
  return client ?? createClient();
}

export function raiseSupabaseError(error: { message: string } | null, action: string): asserts error is null {
  if (error) {
    throw new Error(`${action}: ${error.message}`);
  }
}
