import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const event_id = String(body.event_id || "").trim();
    const full_name = String(body.full_name || "").trim();
    const company = String(body.company || "").trim();
    const contact = String(body.contact || "").trim();
    const consent = Boolean(body.consent);

    if (!event_id) {
      return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
    }

    // Formato lo definimos después en /format, pero dejamos uno por defecto válido
    const format = "horizontal";

    const { data, error } = await supabaseServer
      .from("photo_sessions")
      .insert({
        event_id,
        full_name,
        company,
        contact,
        consent,
        format,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rid: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}