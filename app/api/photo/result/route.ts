import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const event_id = searchParams.get("event_id");
    const participant_id = searchParams.get("participant_id");

    if (!event_id) {
      return NextResponse.json(
        { ok: false, error: "Falta event_id" },
        { status: 400 }
      );
    }

    if (!participant_id) {
      return NextResponse.json(
        { ok: false, error: "Falta participant_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("photo_deliveries")
      .select("*")
      .eq("event_id", event_id)
      .eq("participant_id", participant_id)
      .maybeSingle();

    if (error) {
      console.error("Supabase result error:", error);
      return NextResponse.json(
        { ok: false, error: "Error consultando la foto final" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      delivery: data || null,
    });
  } catch (error) {
    console.error("Photo result route error:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}