const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE env variables");
}

function buildUrl(path: string) {
  return `${supabaseUrl}/rest/v1/${path}`;
}

function buildHeaders(extra?: Record<string, string>) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

export async function supabaseInsert<T = any>(table: string, payload: any) {
  const res = await fetch(buildUrl(table), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      json?.message ||
        json?.error_description ||
        json?.error ||
        `Supabase insert failed (${res.status})`
    );
  }

  return json as T;
}

export async function supabaseSelectOne<T = any>(tableWithQuery: string) {
  const res = await fetch(buildUrl(tableWithQuery), {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      json?.message ||
        json?.error_description ||
        json?.error ||
        `Supabase select failed (${res.status})`
    );
  }

  return json as T;
}

export async function supabaseUpsert<T = any>(table: string, payload: any, onConflict: string) {
  const res = await fetch(buildUrl(`${table}?on_conflict=${encodeURIComponent(onConflict)}`), {
    method: "POST",
    headers: buildHeaders({
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      json?.message ||
        json?.error_description ||
        json?.error ||
        `Supabase upsert failed (${res.status})`
    );
  }

  return json as T;
}