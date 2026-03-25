import "server-only";
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.SUPABASE_URL ?? "";
const rawServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const url = rawUrl.trim();
const serviceRole = rawServiceRole.trim();

if (!url || !serviceRole) {
  throw new Error("Missing SUPABASE env variables");
}

try {
  new URL(url);
} catch {
  throw new Error(`SUPABASE_URL inválida: ${url}`);
}

export const supabaseServer = createClient(url, serviceRole, {
  auth: { persistSession: false },
  global: {
    fetch,
  },
});