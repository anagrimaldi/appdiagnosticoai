"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AREAS,
  EMPLEADOS,
  FRECUENCIAS,
  HERRAMIENTAS,
  OBJETIVOS,
  USO_IA,
  AnswersSchema,
  emptyAnswers,
  emptyProceso,
  horasMes,
  type Answers,
  type Proceso,
} from "@/lib/questionnaire";

type Props = {
  modo: "publico" | "consultor";
  inicial?: Answers;
  diagnosticoId?: string; // si viene, se edita en vez de crear
};

const PASOS = ["Empresa", "Herramientas", "Procesos", "Objetivos", "Revisión"] as const;

export default function DiagnosticForm({ modo, inicial, diagnosticoId }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [a, setA] = useState<Answers>(inicial ?? emptyAnswers());
  const [notas, setNotas] = useState("");
  const [hp, setHp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof Answers>(k: K, v: Partial<Answers[K]>) =>
    setA((prev) => ({ ...prev, [k]: { ...(prev[k] as object), ...v } }));

  const setProceso = (i: number, v: Partial<Proceso>) =>
    setA((prev) => ({ ...prev, procesos: prev.procesos.map((p, j) => (j === i ? { ...p, ...v } : p)) }));

  const toggle = (lista: string[], item: string) =>
    lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];

  function validarPaso(): string | null {
    if (paso === 0) {
      if (!a.empresa.nombre.trim()) return "Indica el nombre de la empresa.";
      if (!a.contacto.nombre.trim()) return "Indica el nombre de contacto.";
      if (!/^\S+@\S+\.\S+$/.test(a.contacto.email)) return "Indica un email válido.";
    }
    if (paso === 2) {
      if (!a.procesos.length) return "Agrega al menos un proceso.";
      if (a.procesos.some((p) => !p.nombre.trim())) return "Cada proceso necesita un nombre.";
    }
    return null;
  }

  function siguiente() {
    const e = validarPaso();
    setError(e);
    if (!e) {
      setPaso((p) => Math.min(p + 1, PASOS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function enviar() {
    const check = AnswersSchema.safeParse(a);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(diagnosticoId ? `/api/diagnosticos/${diagnosticoId}` : "/api/diagnosticos", {
        method: diagnosticoId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagnosticoId ? { respuestas: check.data } : { respuestas: check.data, notas, hp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      if (modo === "publico") router.push("/diagnostico/gracias");
      else router.push(`/panel/${diagnosticoId ?? json.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setEnviando(false);
    }
  }

  const totalHoras = a.procesos.reduce((s, p) => s + horasMes(p), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 grid grid-cols-5 gap-2">
        {PASOS.map((p, i) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => i < paso && setPaso(i)}
              className={`w-full border-t-4 pt-2 text-left text-xs font-medium sm:text-sm ${
                i <= paso ? "border-brand-600 text-brand-700" : "border-slate-200 text-slate-400"
              }`}
            >
              {i + 1}. {p}
            </button>
          </li>
        ))}
      </ol>

      <div className="card space-y-5">
        {paso === 0 && (
          <>
            <h2 className="h2">Datos de la empresa</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la empresa *">
                <input className="input" value={a.empresa.nombre} onChange={(e) => set("empresa", { nombre: e.target.value })} />
              </Field>
              <Field label="Industria / rubro">
                <input className="input" placeholder="Ej: Inmobiliaria, Retail, Salud" value={a.empresa.industria} onChange={(e) => set("empresa", { industria: e.target.value })} />
              </Field>
              <Field label="Cantidad de empleados">
                <select className="input" value={a.empresa.empleados} onChange={(e) => set("empresa", { empleados: e.target.value as Answers["empresa"]["empleados"] })}>
                  {EMPLEADOS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="País">
                <input className="input" value={a.empresa.pais} onChange={(e) => set("empresa", { pais: e.target.value })} />
              </Field>
              <Field label="Sitio web">
                <input className="input" placeholder="https://" value={a.empresa.sitio_web} onChange={(e) => set("empresa", { sitio_web: e.target.value })} />
              </Field>
            </div>
            <Field label="¿A qué se dedica la empresa y cómo vende?">
              <textarea className="input min-h-24" value={a.empresa.descripcion} onChange={(e) => set("empresa", { descripcion: e.target.value })} />
            </Field>
            <h2 className="h2 pt-2">Contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre *">
                <input className="input" value={a.contacto.nombre} onChange={(e) => set("contacto", { nombre: e.target.value })} />
              </Field>
              <Field label="Cargo">
                <input className="input" value={a.contacto.cargo} onChange={(e) => set("contacto", { cargo: e.target.value })} />
              </Field>
              <Field label="Email *">
                <input type="email" className="input" value={a.contacto.email} onChange={(e) => set("contacto", { email: e.target.value })} />
              </Field>
              <Field label="Teléfono / WhatsApp">
                <input className="input" value={a.contacto.telefono} onChange={(e) => set("contacto", { telefono: e.target.value })} />
              </Field>
            </div>
            {/* Honeypot: invisible para personas */}
            <input tabIndex={-1} autoComplete="off" className="hidden" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden />
          </>
        )}

        {paso === 1 && (
          <>
            <h2 className="h2">Herramientas y madurez digital</h2>
            <Field label="¿Qué herramientas usan hoy?">
              <div className="grid gap-2 sm:grid-cols-2">
                {HERRAMIENTAS.map((h) => (
                  <label key={h} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-brand-600" checked={a.madurez.herramientas.includes(h)} onChange={() => set("madurez", { herramientas: toggle(a.madurez.herramientas, h) })} />
                    {h}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Otras herramientas o sistemas (nombres concretos)">
              <input className="input" placeholder="Ej: Siigo, Kommo, Tiendanube, sistema propio…" value={a.madurez.otras_herramientas} onChange={(e) => set("madurez", { otras_herramientas: e.target.value })} />
            </Field>
            <Field label="Uso actual de IA">
              <select className="input" value={a.madurez.uso_ia} onChange={(e) => set("madurez", { uso_ia: Number(e.target.value) })}>
                {USO_IA.map((x, i) => <option key={x} value={i}>{x}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="¿Datos centralizados?">
                <select className="input" value={a.madurez.datos_centralizados} onChange={(e) => set("madurez", { datos_centralizados: e.target.value as "si" })}>
                  <option value="si">Sí</option>
                  <option value="parcial">Parcialmente</option>
                  <option value="no">No, dispersos</option>
                </select>
              </Field>
              <Field label="¿Herramientas integradas?">
                <select className="input" value={a.madurez.integraciones} onChange={(e) => set("madurez", { integraciones: e.target.value as "si" })}>
                  <option value="si">Sí</option>
                  <option value="pocas">Algunas</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field label="¿Equipo técnico interno?">
                <select className="input" value={a.madurez.equipo_tecnico} onChange={(e) => set("madurez", { equipo_tecnico: e.target.value as "si" })}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="h2">Procesos a evaluar</h2>
                <p className="text-sm text-slate-500">Tareas repetitivas, manuales o que generan errores y demoras.</p>
              </div>
              <span className="chip bg-slate-100 text-slate-700">≈ {totalHoras.toFixed(0)} h/mes en total</span>
            </div>
            {a.procesos.map((p, i) => (
              <div key={i} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Proceso {i + 1}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">≈ {horasMes(p).toFixed(1)} h/mes</span>
                    {a.procesos.length > 1 && (
                      <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => setA((prev) => ({ ...prev, procesos: prev.procesos.filter((_, j) => j !== i) }))}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre del proceso *">
                    <input className="input" placeholder="Ej: Responder consultas de WhatsApp" value={p.nombre} onChange={(e) => setProceso(i, { nombre: e.target.value })} />
                  </Field>
                  <Field label="Área">
                    <select className="input" value={p.area} onChange={(e) => setProceso(i, { area: e.target.value })}>
                      {AREAS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="¿Cómo se hace hoy, paso a paso?">
                  <textarea className="input min-h-20" value={p.descripcion} onChange={(e) => setProceso(i, { descripcion: e.target.value })} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="Frecuencia">
                    <select className="input" value={p.frecuencia} onChange={(e) => setProceso(i, { frecuencia: e.target.value as Proceso["frecuencia"] })}>
                      {Object.entries(FRECUENCIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label={p.frecuencia === "por_evento" ? "Eventos al mes" : "Veces por periodo"}>
                    <input type="number" min={0} className="input" value={p.veces_por_periodo} onChange={(e) => setProceso(i, { veces_por_periodo: Number(e.target.value) })} />
                  </Field>
                  <Field label="Minutos por vez">
                    <input type="number" min={0} className="input" value={p.minutos_por_ejecucion} onChange={(e) => setProceso(i, { minutos_por_ejecucion: Number(e.target.value) })} />
                  </Field>
                  <Field label="Personas">
                    <input type="number" min={1} className="input" value={p.personas} onChange={(e) => setProceso(i, { personas: Number(e.target.value) })} />
                  </Field>
                </div>
                <Field label="Herramientas involucradas">
                  <input className="input" placeholder="Ej: Gmail, Excel, WhatsApp" value={p.herramientas} onChange={(e) => setProceso(i, { herramientas: e.target.value })} />
                </Field>
                <Field label="¿Qué problema genera? (demoras, errores, costos…)">
                  <textarea className="input min-h-16" value={p.dolor} onChange={(e) => setProceso(i, { dolor: e.target.value })} />
                </Field>
              </div>
            ))}
            {a.procesos.length < 25 && (
              <button type="button" className="btn-secondary w-full" onClick={() => setA((prev) => ({ ...prev, procesos: [...prev.procesos, emptyProceso()] }))}>
                + Agregar proceso
              </button>
            )}
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="h2">Objetivos y restricciones</h2>
            <Field label="¿Qué buscan lograr?">
              <div className="grid gap-2 sm:grid-cols-2">
                {OBJETIVOS.map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-brand-600" checked={a.objetivos.objetivos.includes(o)} onChange={() => set("objetivos", { objetivos: toggle(a.objetivos.objetivos, o) })} />
                    {o}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Si solo pudieran resolver una cosa en 90 días, ¿cuál sería?">
              <textarea className="input min-h-16" value={a.objetivos.prioridad} onChange={(e) => set("objetivos", { prioridad: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Presupuesto mensual en herramientas (USD)">
                <input className="input" placeholder="Ej: 100-300" value={a.objetivos.presupuesto_herramientas_usd} onChange={(e) => set("objetivos", { presupuesto_herramientas_usd: e.target.value })} />
              </Field>
              <Field label="Presupuesto de implementación (USD)">
                <input className="input" placeholder="Ej: 2000-5000" value={a.objetivos.presupuesto_implementacion_usd} onChange={(e) => set("objetivos", { presupuesto_implementacion_usd: e.target.value })} />
              </Field>
              <Field label="Costo hora promedio de un empleado (USD)">
                <input type="number" min={0} className="input" value={a.objetivos.costo_hora_empleado_usd} onChange={(e) => set("objetivos", { costo_hora_empleado_usd: Number(e.target.value) })} />
              </Field>
              <Field label="n8n: preferencia de hosting">
                <select className="input" value={a.objetivos.hosting_n8n} onChange={(e) => set("objetivos", { hosting_n8n: e.target.value as "cloud" })}>
                  <option value="no_se">No sé / que lo recomienden</option>
                  <option value="cloud">n8n Cloud (gestionado)</option>
                  <option value="self_hosted">Self-hosted (servidor propio)</option>
                </select>
              </Field>
              <Field label="Plazo esperado">
                <input className="input" placeholder="Ej: 1-2 meses" value={a.objetivos.plazo} onChange={(e) => set("objetivos", { plazo: e.target.value })} />
              </Field>
            </div>
            <Field label="Restricciones (datos sensibles, compliance, sistemas que no se pueden tocar…)">
              <textarea className="input min-h-16" value={a.objetivos.restricciones} onChange={(e) => set("objetivos", { restricciones: e.target.value })} />
            </Field>
          </>
        )}

        {paso === 4 && (
          <>
            <h2 className="h2">Revisión</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Resumen k="Empresa" v={`${a.empresa.nombre} · ${a.empresa.industria || "—"} · ${a.empresa.empleados} empleados`} />
              <Resumen k="Contacto" v={`${a.contacto.nombre} · ${a.contacto.email}`} />
              <Resumen k="Herramientas" v={a.madurez.herramientas.join(", ") || "—"} />
              <Resumen k="Objetivos" v={a.objetivos.objetivos.join(", ") || "—"} />
              <Resumen k="Procesos" v={a.procesos.map((p) => p.nombre).join(" · ")} />
              <Resumen k="Tiempo actual estimado" v={`${totalHoras.toFixed(0)} horas/mes`} />
            </dl>
            {modo === "consultor" && !diagnosticoId && (
              <Field label="Notas internas del consultor (no las ve el cliente)">
                <textarea className="input min-h-24" placeholder="Contexto de la reunión, observaciones, prioridades detectadas…" value={notas} onChange={(e) => setNotas(e.target.value)} />
              </Field>
            )}
            {modo === "publico" && (
              <p className="text-sm text-slate-500">
                Al enviar, un consultor revisará tu información y te compartirá el informe con las oportunidades de automatización.
              </p>
            )}
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-between pt-2">
          <button type="button" className="btn-ghost" disabled={paso === 0 || enviando} onClick={() => setPaso((p) => p - 1)}>
            ← Atrás
          </button>
          {paso < PASOS.length - 1 ? (
            <button type="button" className="btn-primary" onClick={siguiente}>
              Siguiente →
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={enviando} onClick={enviar}>
              {enviando ? "Guardando…" : diagnosticoId ? "Guardar cambios" : "Enviar diagnóstico"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function Resumen({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
      <dd className="mt-1 text-slate-800">{v}</dd>
    </div>
  );
}
