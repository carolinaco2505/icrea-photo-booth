import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rid, cloudinary_public_id, cloudinary_url } = body ?? {};

    if (!rid) {
      return NextResponse.json({ error: "Missing rid" }, { status: 400 });
    }
    if (!cloudinary_public_id || !cloudinary_url) {
      return NextResponse.json(
        { error: "Missing cloudinary_public_id or cloudinary_url" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("photo_sessions")
      .update({
        cloudinary_public_id,
        cloudinary_url,
      })
      .eq("id", rid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}