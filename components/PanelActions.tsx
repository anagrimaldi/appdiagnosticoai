"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  token: string;
  estado: string;
  estados: Record<string, string>;
  notas: string;
  tarifa: number;
  tieneResultado: boolean;
  errorAnalisis: string | null;
};

export default function PanelActions(p: Props) {
  const router = useRouter();
  const [notas, setNotas] = useState(p.notas);
  const [tarifa, setTarifa] = useState(p.tarifa);
  const [estado, setEstado] = useState(p.estado);
  const [analizando, setAnalizando] = useState(p.estado === "analizando");
  const [segundos, setSegundos] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(p.errorAnalisis);

  useEffect(() => {
    if (!analizando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [analizando]);

  async function patch(body: object) {
    const res = await fetch(`/api/diagnosticos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Error");
  }

  async function guardar() {
    setMsg(null);
    try {
      await patch({ notas_consultor: notas, tarifa_hora_usd: tarifa });
      setMsg("Guardado");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function cambiarEstado(v: string) {
    setEstado(v);
    await patch({ estado: v }).catch(() => {});
    router.refresh();
  }

  async function analizar() {
    if (p.tieneResultado && !confirm("Se reemplazará el análisis actual y se descartarán los flujos n8n ya diseñados. ¿Continuar?")) return;
    setAnalizando(true);
    setSegundos(0);
    setError(null);
    try {
      await patch({ notas_consultor: notas, tarifa_hora_usd: tarifa });
      const res = await fetch(`/api/diagnosticos/${p.id}/analizar`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Error al analizar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setAnalizando(false);
    }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar este diagnóstico definitivamente?")) return;
    await fetch(`/api/diagnosticos/${p.id}`, { method: "DELETE" });
    router.push("/panel");
    router.refresh();
  }

  const enlace = typeof window !== "undefined" ? `${window.location.origin}/informe/${p.token}` : `/informe/${p.token}`;

  return (
    <aside className="card no-print space-y-5">
      <div>
        <span className="label">Estado</span>
        <select className="input" value={estado} onChange={(e) => cambiarEstado(e.target.value)} disabled={analizando}>
          {Object.entries(p.estados).filter(([k]) => k !== "analizando").map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="label">Tarifa por hora (USD)</span>
        <input type="number" min={0} className="input" value={tarifa} onChange={(e) => setTarifa(Number(e.target.value))} />
      </div>
      <div>
        <span className="label">Notas del consultor</span>
        <textarea className="input min-h-32" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Contexto adicional para la IA: hallazgos de la reunión, prioridades, sistemas…" />
        <div className="mt-2 flex items-center gap-2">
          <button className="btn-secondary" onClick={guardar} disabled={analizando}>Guardar</button>
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <button className="btn-primary w-full" onClick={analizar} disabled={analizando}>
          {analizando ? `Analizando con IA… ${segundos}s` : p.tieneResultado ? "↻ Regenerar análisis" : "✨ Generar diagnóstico con IA"}
        </button>
        {analizando && <p className="mt-2 text-xs text-slate-500">Suele tardar entre 1 y 4 minutos. No cierres esta pestaña.</p>}
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </div>

      {p.tieneResultado && (
        <div className="space-y-2 border-t border-slate-200 pt-5">
          <span className="label">Informe para el cliente</span>
          <div className="flex gap-2">
            <input readOnly className="input text-xs" value={enlace} onFocus={(e) => e.target.select()} />
            <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(enlace).then(() => setMsg("Enlace copiado"))}>Copiar</button>
          </div>
          <a href={`/informe/${p.token}`} target="_blank" className="btn-secondary w-full">Abrir informe / PDF</a>
        </div>
      )}

      <div className="flex justify-between border-t border-slate-200 pt-5">
        <a href={`/panel/${p.id}/editar`} className="btn-ghost">Editar respuestas</a>
        <button className="btn-ghost text-red-600" onClick={eliminar}>Eliminar</button>
      </div>
    </aside>
  );
}
