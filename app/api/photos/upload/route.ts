import "server-only";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { supabaseServer } from "@/lib/supabaseServer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rid, eventId, format, dataUrl } = body || {};

    if (!rid || !eventId || !format || !dataUrl) {
      return new NextResponse("Missing rid/eventId/format/dataUrl", { status: 400 });
    }

    // Subir a Cloudinary (folder por evento)
    const upload = await cloudinary.uploader.upload(dataUrl, {
      folder: `icrea-photo-booth/${eventId}`,
      public_id: rid,          // para que el id sea estable (1 foto por rid)
      overwrite: true,
      resource_type: "image",
    });

    const cloudinary_public_id = upload.public_id;
    const cloudinary_url = upload.secure_url;

    // Guardar en Supabase (fuente de verdad)
    const { error } = await supabaseServer
      .from("photo_sessions")
      .update({
        format,
        cloudinary_public_id,
        cloudinary_url,
      })
      .eq("id", rid);

    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      cloudinary_public_id,
      cloudinary_url,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Upload failed", { status: 500 });
  }
}