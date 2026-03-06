import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rid = String(body.rid || "").trim();
    const format = String(body.format || "").trim(); // vertical | horizontal
    const cloudinary_public_id = body.cloudinary_public_id ? String(body.cloudinary_public_id) : null;
    const cloudinary_url = body.cloudinary_url ? String(body.cloudinary_url) : null;

    if (!rid) {
      return NextResponse.json({ error: "Missing rid" }, { status: 400 });
    }
    if (format && !["vertical", "horizontal"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const update: any = {};
    if (format) update.format = format;
    if (cloudinary_public_id) update.cloudinary_public_id = cloudinary_public_id;
    if (cloudinary_url) update.cloudinary_url = cloudinary_url;

    const { error } = await supabaseServer
      .from("photo_sessions")
      .update(update)
      .eq("id", rid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}