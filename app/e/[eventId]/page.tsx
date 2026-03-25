"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function EventPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function buildRid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `rid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !company.trim() || !contact.trim()) {
      setError("Completa todos los campos para continuar.");
      return;
    }

    if (!consent) {
      setError("Debes autorizar el uso de tu imagen para continuar.");
      return;
    }

    setLoading(true);

    try {
      const rid = buildRid();

      const qs = new URLSearchParams({
        rid,
        fullName: fullName.trim(),
        company: company.trim(),
        contact: contact.trim(),
        consent: "true",
      });

      router.push(`/e/${encodeURIComponent(eventId)}/format?${qs.toString()}`);
    } catch (err: any) {
      setError(err?.message || "No pude continuar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">
          Captura los mejores momentos con ICREA
        </h1>
        <p className="text-sm text-white/70 mb-6">
          Completa tus datos y autoriza el uso de tu imagen para continuar.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full p-3 rounded bg-black/40 border border-white/20"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            className="w-full p-3 rounded bg-black/40 border border-white/20"
            placeholder="Empresa"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <input
            className="w-full p-3 rounded bg-black/40 border border-white/20"
            placeholder="Email o WhatsApp"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <label className="flex items-start gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Autorizo el uso de mi imagen para fines promocionales de ICREA, en el
            marco de este seminario.
          </label>

          {error && (
            <div className="text-sm text-red-400 border border-red-400/30 bg-red-500/10 p-3 rounded">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-white text-black p-3 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Continuando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}