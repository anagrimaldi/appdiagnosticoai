"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FlowButton({ id, opId, existe }: { id: string; opId: string; existe: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando) return;
    const t = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [cargando]);

  async function generar() {
    if (existe && !confirm("Se reemplazará el flujo actual. ¿Continuar?")) return;
    setCargando(true);
    setSeg(0);
    setError(null);
    try {
      const res = await fetch(`/api/diagnosticos/${id}/flujo/${opId}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Error al diseñar el flujo");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al diseñar el flujo");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="no-print flex flex-col items-end gap-1">
      <button className={existe ? "btn-ghost" : "btn-secondary"} onClick={generar} disabled={cargando}>
        {cargando ? `Diseñando flujo… ${seg}s` : existe ? "↻ Regenerar flujo" : "⚙ Diseñar flujo n8n"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
