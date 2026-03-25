import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventId = String(body.eventId || "").trim();
    const fullName = String(body.fullName || "").trim();
    const company = String(body.company || "").trim();
    const contact = String(body.contact || "").trim();
    const consent = Boolean(body.consent);

    if (!eventId || !fullName || !company || !contact) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { ok: false, error: "Consentimiento requerido" },
        { status: 400 }
      );
    }

    console.log("REGISTER INPUT", {
      eventId,
      fullName,
      company,
      contact,
      consent,
      supabaseUrl: (process.env.SUPABASE_URL || "").trim(),
      hasServiceRoleKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    });

    const { data, error } = await supabaseServer
      .from("photo_sessions")
      .insert({
        event_id: eventId,
        full_name: fullName,
        company,
        contact,
        consent: true,
        format: "horizontal",
      })
      .select("id")
      .single();

    if (error) {
      console.error("REGISTER SUPABASE ERROR", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Error guardando sesión" },
        { status: 500 }
      );
    }

    console.log("REGISTER API RESPONSE", { ok: true, rid: data.id });

    return NextResponse.json({ ok: true, rid: data.id }, { status: 200 });
  } catch (e: any) {
    console.error("REGISTER ROUTE ERROR", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error interno en register" },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: true, method: "GET" }, { status: 200 });
}