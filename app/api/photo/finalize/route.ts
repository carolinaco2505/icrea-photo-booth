import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { Resend } from "resend";

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizePhone(v: string) {
  return v.replace(/[^\d]/g, "");
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function uploadToCloudinary(dataUrl: string, folder: string, publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Faltan variables CLOUDINARY_CLOUD_NAME o CLOUDINARY_UPLOAD_PRESET");
  }

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Cloudinary error:", json);
    throw new Error(json?.error?.message || "Error subiendo a Cloudinary");
  }

  return {
    secure_url: json.secure_url as string,
    public_id: json.public_id as string,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      event_id,
      participant_id,
      participant_name,
      contact,
      company,
      cloudinary_url,
      dataUrl,
      imageDataUrl,
    } = body ?? {};

    console.log("FINALIZE DEBUG", {
  event_id,
  participant_id,
  participant_name,
  contact,
  hasDataUrl: !!dataUrl,
  hasCloudinaryUrl: !!cloudinary_url,
});

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

    const incomingImage = cloudinary_url || imageDataUrl || dataUrl;

    if (!incomingImage) {
      return NextResponse.json(
        { ok: false, error: "Falta la imagen final" },
        { status: 400 }
      );
    }

    let finalImage = incomingImage;
    let finalPublicId: string | null = null;

    // Si viene como dataUrl/base64, la subimos a Cloudinary
    if (incomingImage.startsWith("data:image")) {
      //const folder = slugify(event_id);
      //const publicId = `${participant_id}-${Date.now()}`;
      const eventFolder = slugify(event_id);
const companyFolder = slugify(company || "sin-empresa");
const folder = `${eventFolder}/${companyFolder}`;
const publicId = `${participant_id}-${Date.now()}`;

      const uploaded = await uploadToCloudinary(incomingImage, folder, publicId);
      finalImage = uploaded.secure_url;
      finalPublicId = uploaded.public_id;
    }

    const safeContact = (contact || "").trim();
    const contactHash = safeContact ? sha1(safeContact.toLowerCase()) : null;

    const payload = {
  event_id,
  participant_id,
  participant_name: participant_name || null,
  company: company || null,
  contact: safeContact || null,
  contact_hash: contactHash,
  photo_url: finalImage,
  cloudinary_public_id: finalPublicId,
  sent_at: new Date().toISOString(),
};

    const { error: dbError } = await supabaseServer
      .from("photo_deliveries")
      .upsert(payload, {
        onConflict: "event_id,participant_id",
      });

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { ok: false, error: "Error guardando en base de datos" },
        { status: 500 }
      );
    }

console.log("CLOUDINARY FOLDER DEBUG", {
  event_id,
  company,
  eventFolder: slugify(event_id),
  companyFolder: slugify(company || "sin-empresa"),
  folder: `${slugify(event_id)}/${slugify(company || "sin-empresa")}`,
});

    let emailSent = false;
    let whatsappUrl: string | null = null;

if (safeContact && isEmail(safeContact)) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;

  console.log("EMAIL CHECK", {
    safeContact,
    isEmail: isEmail(safeContact),
    hasResendApiKey: !!resendApiKey,
    resendFrom,
  });

  if (resendApiKey && resendFrom) {
    const resend = new Resend(resendApiKey);

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.5;">
        <h2>Tu foto está lista</h2>
        <p>Hola${participant_name ? ` ${participant_name}` : ""},</p>
        <p>Te compartimos tu foto del evento.</p>
        <p>
          <a href="${finalImage}" target="_blank" style="
            display:inline-block;
            padding:12px 18px;
            background:#111827;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
          ">
            Ver / descargar foto
          </a>
        </p>
        <p>O abre este enlace directamente:</p>
        <p><a href="${finalImage}" target="_blank">${finalImage}</a></p>
      </div>
    `;

    try {
      console.log("RESEND DEBUG", {
        from: resendFrom,
        to: safeContact,
        subject: "Tu foto del evento está lista",
      });

      const resendResult = await resend.emails.send({
        from: resendFrom,
        to: safeContact,
        subject: "Tu foto del evento está lista",
        html,
      });

      console.log("RESEND RESULT", resendResult);
      emailSent = true;
    } catch (emailError) {
      console.error("Resend error:", emailError);
    }
  } else {
    console.warn("Faltan RESEND_API_KEY o RESEND_FROM");
  }
} else if (safeContact) {
  console.warn("No se enviará email porque contact no es un email válido", {
    safeContact,
  });

  const phone = normalizePhone(safeContact);

  if (phone) {
    const text = `Hola${
      participant_name ? ` ${participant_name}` : ""
    }, aquí está tu foto del evento: ${finalImage}`;

    whatsappUrl = `https://wa.me/57${phone}?text=${encodeURIComponent(text)}`;
  }
}
    }

    return NextResponse.json({
      ok: true,
      photoUrl: finalImage,
      cloudinaryPublicId: finalPublicId,
      emailSent,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error("Finalize route error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}