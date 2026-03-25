import { NextResponse } from "next/server";
import { supabaseSelectOne } from "@/lib/supabaseRest";

type SessionRow = {
  id: string;
  event_id: string;
  full_name: string | null;
  company: string | null;
  contact: string | null;
  consent: boolean | null;
  format: string | null;
  cloudinary_url: string | null;
  cloudinary_public_id: string | null;
  created_at: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rid = String(searchParams.get("rid") || "").trim();

    if (!rid) {
      return NextResponse.json(
        { ok: false, error: "Falta rid" },
        { status: 400 }
      );
    }

    const rows = await supabaseSelectOne<SessionRow[]>(
      `photo_sessions?select=id,event_id,full_name,company,contact,consent,format,cloudinary_url,cloudinary_public_id,created_at&id=eq.${encodeURIComponent(
        rid
      )}&limit=1`
    );

    return NextResponse.json(
      {
        ok: true,
        session: rows?.[0] ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("SESSION ROUTE ERROR", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error leyendo sesión" },
      { status: 500 }
    );
  }
}