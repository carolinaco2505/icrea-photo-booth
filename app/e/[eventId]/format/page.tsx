"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";

export default function FormatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { eventId } = useParams<{ eventId: string }>();

  const rid = searchParams.get("rid");

  function go(format: "vertical" | "horizontal") {
    if (!rid) return;

    if (!rid) {
  alert("Error: no se encontró el registro. Por favor vuelve a iniciar.");
  router.push(`/e/${eventId}`);
  return;
}

    router.push(
  `/e/${encodeURIComponent(eventId)}/capture?rid=${encodeURIComponent(rid || "")}&format=${format}`
);
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Elige el formato</h1>
        <p className="text-sm text-white/70 mb-6">
          Evento: <span className="text-white/90">{eventId}</span>
          <br />
          Registro: <span className="text-white/90">{rid ?? "-"}</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={() => go("vertical")}
            className="w-full bg-white text-black p-3 rounded font-medium"
            disabled={!rid}
          >
            Foto Vertical
          </button>

          <button
            onClick={() => go("horizontal")}
            className="w-full bg-white text-black p-3 rounded font-medium"
            disabled={!rid}
          >
            Foto Horizontal
          </button>

          <button
            onClick={() => router.push(`/e/${encodeURIComponent(eventId)}`)}
            className="w-full border border-white/30 text-white p-3 rounded"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}