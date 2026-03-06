import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rid = (url.searchParams.get("rid") || "").trim();

    if (!rid) {
      return NextResponse.json({ error: "Falta rid" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("photo_sessions")
      .select(
        "id, event_id, full_name, company, contact, consent, format, cloudinary_url, cloudinary_public_id, created_at"
      )
      .eq("id", rid)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, session: data ?? null }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error leyendo sesión" },
      { status: 500 }
    );
  }
}