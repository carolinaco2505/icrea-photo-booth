import { NextResponse } from "next/server";
import { supabaseInsert } from "@/lib/supabaseRest";

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

    const rows = await supabaseInsert<{ id: string }[]>("photo_sessions", {
      event_id: eventId,
      full_name: fullName,
      company,
      contact,
      consent: true,
      format: "horizontal",
    });

    const rid = rows?.[0]?.id;

    if (!rid) {
      return NextResponse.json(
        { ok: false, error: "No se pudo obtener el id del registro" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, rid }, { status: 200 });
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