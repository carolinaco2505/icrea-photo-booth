"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getEventName } from "@/lib/events";

type Format = "horizontal" | "vertical";

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: HTMLVideoElement | HTMLImageElement,
  destW: number,
  destH: number
) {
  const sw =
    (source as HTMLVideoElement).videoWidth ||
    (source as HTMLImageElement).naturalWidth;
  const sh =
    (source as HTMLVideoElement).videoHeight ||
    (source as HTMLImageElement).naturalHeight;

  if (!sw || !sh) return;

  const sAspect = sw / sh;
  const dAspect = destW / destH;

  let sx = 0;
  let sy = 0;
  let sWidth = sw;
  let sHeight = sh;

  if (sAspect > dAspect) {
    sWidth = Math.round(sh * dAspect);
    sx = Math.round((sw - sWidth) / 2);
  } else {
    sHeight = Math.round(sw / dAspect);
    sy = Math.round((sh - sHeight) / 2);
  }

  ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, destW, destH);
}

export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const eventId = useMemo(() => {
    const v = (params as { eventId?: string | string[] })?.eventId;
    return Array.isArray(v) ? v[0] : v || "";
  }, [params]);

  const rid = searchParams.get("rid") || "";
  const fullName = searchParams.get("fullName") || "";
  const company = searchParams.get("company") || "";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const consent = searchParams.get("consent") || "false";
  const format = (searchParams.get("format") || "horizontal") as Format;

  const OUT = useMemo(() => {
    if (format === "vertical") return { w: 1080, h: 1920 };
    return { w: 1920, h: 1080 };
  }, [format]);

  const overlayPath = useMemo(() => {
    return format === "vertical"
      ? `/overlays/${eventId}/vertical.png`
      : `/overlays/${eventId}/horizontal.png`;
  }, [format]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState("");
  const [shotDataUrl, setShotDataUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(
    "user"
  );

  useEffect(() => {
    if (!rid || !fullName || !company || !email || !phone || consent !== "true") {
      setError("Faltan datos del registro. Vuelve a comenzar.");
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setError("");
        setCameraReady(false);

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) return;

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraReady(true);
      } catch (e: any) {
        setError(
          e?.message ||
            "No pude acceder a la cámara. Revisa permisos del navegador."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraFacing, rid, fullName, company, email, phone, consent]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let raf = 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUT.w;
    canvas.height = OUT.h;

    const overlayImg = new Image();
    overlayImg.src = overlayPath;

    const tick = () => {
      ctx.clearRect(0, 0, OUT.w, OUT.h);
      drawCover(ctx, video, OUT.w, OUT.h);

      if (overlayImg.complete) {
        ctx.drawImage(overlayImg, 0, 0, OUT.w, OUT.h);
      }

      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(raf);
  }, [OUT.w, OUT.h, overlayPath]);

  const takePhoto = async () => {
    try {
      setError("");

      const video = videoRef.current;
      if (!video) {
        setError("No encontré la cámara activa.");
        return;
      }

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = OUT.w;
      finalCanvas.height = OUT.h;

      const ctx = finalCanvas.getContext("2d");
      if (!ctx) {
        setError("No pude preparar la imagen final.");
        return;
      }

      drawCover(ctx, video, OUT.w, OUT.h);

      const overlayImg = new Image();
      overlayImg.src = overlayPath;

      await new Promise<void>((resolve) => {
        if (overlayImg.complete) return resolve();
        overlayImg.onload = () => resolve();
        overlayImg.onerror = () => resolve();
      });

      ctx.drawImage(overlayImg, 0, 0, OUT.w, OUT.h);

      const finalDataUrl = finalCanvas.toDataURL("image/jpeg", 0.82);
      setShotDataUrl(finalDataUrl);
    } catch (e: any) {
      setError(e?.message || "No pude tomar la foto.");
    }
  };

  const onRepeat = () => {
    setError("");
    setShotDataUrl("");
  };

  const onChangeFormat = () => {
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

  const onContinue = async () => {
    setError("");

    if (!eventId) {
      setError("Falta eventId.");
      return;
    }

    if (!rid) {
      setError("Falta rid.");
      return;
    }

    if (!shotDataUrl) {
      setError("Primero toma la foto.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/photo/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          participant_id: rid,
          participant_name: fullName,
          email,
          phone,
          company,
          dataUrl: shotDataUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || `Finalize failed (${res.status})`);
      }

      const photoUrl = String(json?.photoUrl || "").trim();

      if (!photoUrl) {
        throw new Error("No se recibió la URL final de la foto.");
      }

      const resultQs = new URLSearchParams({
        rid,
        format,
        fullName,
        company,
        email,
        phone,
        consent,
        photoUrl,
      });

      router.push(`/e/${encodeURIComponent(eventId)}/result?${resultQs.toString()}`);
    } catch (e: any) {
      setError(e?.message || "No pude guardar la foto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="mb-3">
          <h1 className="text-2xl font-semibold">Toma tu foto</h1>
          <p className="text-sm text-white/70">
            Evento: <span className="text-white/90">{getEventName(eventId)}</span> · Registro:{" "}
            <span className="text-white/90">{rid || "-"}</span> · Formato:{" "}
            <span className="text-white/90">{format}</span>
          </p>
        </div>

        {error ? (
          <div className="mb-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4">
          <div className="w-full rounded border border-white/15 bg-black/40 p-3">
            {!shotDataUrl ? (
              <div className="flex items-center justify-center">
                <div
                  className={`w-full ${
                    format === "vertical"
                      ? "max-w-[420px] aspect-[9/16]"
                      : "max-w-[720px] aspect-[16/9]"
                  } bg-black flex items-center justify-center overflow-hidden rounded`}
                >
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div
                  className={`w-full ${
                    format === "vertical"
                      ? "max-w-[420px] aspect-[9/16]"
                      : "max-w-[720px] aspect-[16/9]"
                  } bg-black flex items-center justify-center overflow-hidden rounded`}
                >
                  <img
                    src={shotDataUrl}
                    alt="Foto final"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <video ref={videoRef} playsInline muted className="hidden" />

          <div className="flex flex-wrap gap-2">
            {!shotDataUrl ? (
              <button
                onClick={takePhoto}
                disabled={!cameraReady || saving}
                className="px-4 py-2 rounded bg-white text-black disabled:opacity-40"
              >
                {cameraReady ? "Tomar foto" : "Cargando cámara..."}
              </button>
            ) : (
              <button
                onClick={onRepeat}
                disabled={saving}
                className="px-4 py-2 rounded border border-white/30 hover:border-white/60 disabled:opacity-40"
              >
                Repetir
              </button>
            )}

            <button
              onClick={() =>
                setCameraFacing((prev) =>
                  prev === "user" ? "environment" : "user"
                )
              }
              disabled={saving}
              className="px-4 py-2 rounded border border-white/30 hover:border-white/60 disabled:opacity-40"
            >
              {cameraFacing === "user"
                ? "Usar cámara trasera"
                : "Usar cámara frontal"}
            </button>

            <button
              onClick={onChangeFormat}
              disabled={saving}
              className="px-4 py-2 rounded border border-white/30 hover:border-white/60 disabled:opacity-40"
            >
              Cambiar formato
            </button>

            <button
              onClick={onContinue}
              disabled={!shotDataUrl || saving}
              className="px-4 py-2 rounded bg-white text-black disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Continuar"}
            </button>
          </div>

          <div className="text-xs text-white/40">
            Overlay: {overlayPath} · Salida: {OUT.w}×{OUT.h}
          </div>
        </div>
      </div>
    </div>
  );
}