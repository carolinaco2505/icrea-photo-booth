"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Format = "horizontal" | "vertical";

type DeliveryRow = {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string | null;
  contact: string | null;
  contact_hash: string | null;
  photo_url: string | null;
  sent_at: string | null;
};

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

  const overlayPath = useMemo(() => {
    return format === "vertical"
      ? "/overlays/vertical.png"
      : "/overlays/horizontal.png";
  }, [format]);

  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDeliveryOnce() {
      const res = await fetch(
        `/api/photo/result?event_id=${encodeURIComponent(
          eventId
        )}&participant_id=${encodeURIComponent(rid)}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `No pude leer la foto final (${res.status})`);
      }

      const json = await res.json().catch(() => ({}));
      const row: DeliveryRow | null = json?.delivery ?? null;
      return row;
    }

    async function loadWithRetry() {
      try {
        setError("");
        setLoading(true);

        if (!eventId) {
          setError("Falta eventId.");
          return;
        }

        if (!rid) {
          setError("Falta rid (registro). Vuelve a empezar desde el formulario.");
          return;
        }

        const maxTries = 15;

        for (let i = 0; i < maxTries; i++) {
          const row = await fetchDeliveryOnce();
          if (cancelled) return;

          setDelivery(row);

          if (row?.photo_url) break;

          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error cargando la foto final");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWithRetry();

    return () => {
      cancelled = true;
    };
  }, [eventId, rid]);

  const goRepeat = () => {
    router.push(
      `/e/${encodeURIComponent(eventId)}/capture?rid=${encodeURIComponent(
        rid
      )}&format=${encodeURIComponent(format)}`
    );
  };

  const goChangeFormat = () => {
    router.push(
      `/e/${encodeURIComponent(eventId)}/format?rid=${encodeURIComponent(rid)}`
    );
  };

  const onDownload = () => {
    const url = delivery?.photo_url;
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = `icrea-${eventId}-${rid}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1">Tu foto está lista</h1>
        <p className="text-sm text-white/70 mb-4">
          Evento: <span className="text-white/90">{eventId}</span> · Registro:{" "}
          <span className="text-white/90">{rid || "-"}</span>
        </p>

        {error ? (
          <div className="mb-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        ) : null}

        <div className="rounded border border-white/15 bg-black/40 p-3">
          {loading ? (
            <div className="text-sm text-white/70">Cargando desde Supabase...</div>
          ) : delivery?.photo_url ? (
            <div className="flex items-center justify-center">
              <img
                src={delivery.photo_url}
                alt="Foto final"
                className="max-w-full h-auto block"
                style={{ maxWidth: "1100px" }}
              />
            </div>
          ) : (
            <div className="text-sm text-white/70">
              No veo la imagen final todavía (photo_url está vacío para este rid).
              <div className="text-xs text-white/40 mt-2">
                Overlay: {overlayPath}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Tip: si recargas fuerte / abres en otra pestaña, puede perderse el estado del navegador.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={goRepeat}
            className="px-4 py-2 rounded border border-white/30 hover:border-white/60"
          >
            Repetir
          </button>

          <button
            onClick={goChangeFormat}
            className="px-4 py-2 rounded border border-white/30 hover:border-white/60"
          >
            Cambiar formato
          </button>

          <button
            onClick={onDownload}
            disabled={!delivery?.photo_url}
            className="px-4 py-2 rounded bg-white text-black disabled:opacity-40"
          >
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}