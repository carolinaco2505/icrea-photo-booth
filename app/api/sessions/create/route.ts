import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, fullName, company, contact, consent } = body || {};

    if (!eventId || !fullName || !company || !contact || !consent) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("photo_sessions")
      .insert({
        event_id: eventId,
        full_name: fullName,
        company,
        contact,
        consent: true,
        format: "horizontal", // default (luego se actualiza)
      })
      .select("id")
      .single();

    if (error) return new NextResponse(error.message, { status: 500 });

    return NextResponse.json({ rid: data.id });
  } catch (e: any) {
    return new NextResponse(e?.message || "Create failed", { status: 500 });
  }
}