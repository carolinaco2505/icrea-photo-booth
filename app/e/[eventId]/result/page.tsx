"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Format = "horizontal" | "vertical";

function normalizePhone(v: string) {
  return v.replace(/[^\d]/g, "");
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const eventId = useMemo(() => {
    const v = (params as { eventId?: string | string[] })?.eventId;
    return Array.isArray(v) ? v[0] : v || "";
  }, [params]);

  const rid = searchParams.get("rid") || "";
  const format = (searchParams.get("format") || "horizontal") as Format;
  const fullName = searchParams.get("fullName") || "";
  const company = searchParams.get("company") || "";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const consent = searchParams.get("consent") || "";
  const photoUrl = searchParams.get("photoUrl") || "";

  const onDownload = async () => {
  if (!photoUrl) return;

  try {
    const response = await fetch(photoUrl);
    if (!response.ok) {
      throw new Error("No se pudo descargar la imagen");
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `icrea-${eventId}-${rid}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download error:", error);
    window.open(photoUrl, "_blank", "noopener,noreferrer");
  }
};

  const onWhatsApp = () => {
    if (!photoUrl) return;

    const message = `Hola${
      fullName ? ` ${fullName}` : ""
    }, aquí está tu foto del evento: ${photoUrl}`;

    let whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (phone) {
      const normalized = normalizePhone(phone);
      if (normalized) {
        const phoneWithCountry = normalized.startsWith("57")
          ? normalized
          : `57${normalized}`;
        whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
          message
        )}`;
      }
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const goRepeat = () => {
    const qs = new URLSearchParams({
      rid,
      fullName,
      company,
      email,
      phone,
      consent,
      format,
    });

    router.push(`/e/${encodeURIComponent(eventId)}/capture?${qs.toString()}`);
  };

  const goChangeFormat = () => {
    const qs = new URLSearchParams({
      rid,
      fullName,
      company,
      email,
      phone,
      consent,
    });

    router.push(`/e/${encodeURIComponent(eventId)}/format?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1">Tu foto está lista</h1>
        <p className="text-sm text-white/70 mb-2">
          Evento: <span className="text-white/90">{eventId}</span> · Registro:{" "}
          <span className="text-white/90">{rid || "-"}</span>
        </p>
        <p className="text-sm text-white/60 mb-4">
          Guárdala ahora o envíatela por WhatsApp para no perderla.
        </p>

        <div className="rounded border border-white/15 bg-black/40 p-3">
          {photoUrl ? (
            <div className="flex items-center justify-center">
              <img
                src={photoUrl}
                alt="Foto final"
                className="max-w-full h-auto block rounded"
                style={{ maxWidth: "1100px" }}
              />
            </div>
          ) : (
            <div className="text-sm text-red-300">
              No se encontró la URL de la foto final. Vuelve a tomarla.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onWhatsApp}
            disabled={!photoUrl}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-40"
          >
            Enviar a mi WhatsApp
          </button>

          <button
            onClick={onDownload}
            disabled={!photoUrl}
            className="px-4 py-2 rounded bg-white text-black disabled:opacity-40"
          >
            Descargar foto
          </button>

          <button
            onClick={goRepeat}
            className="px-4 py-2 rounded border border-white/30 hover:border-white/60"
          >
            Tomar otra foto
          </button>

          <button
            onClick={goChangeFormat}
            className="px-4 py-2 rounded border border-white/30 hover:border-white/60"
          >
            Cambiar formato
          </button>
        </div>
      </div>
    </div>
  );
}