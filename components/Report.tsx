import { usd } from "@/lib/finance";
import type { Diagnostico } from "@/lib/data";
import type { Oportunidad } from "@/lib/result-schema";

const nivelColor = {
  alto: "bg-emerald-100 text-emerald-800",
  medio: "bg-amber-100 text-amber-800",
  bajo: "bg-slate-100 text-slate-700",
} as const;
const esfuerzoColor = {
  bajo: "bg-emerald-100 text-emerald-800",
  medio: "bg-amber-100 text-amber-800",
  alto: "bg-red-100 text-red-800",
} as const;

export default function Report({ d, interno }: { d: Diagnostico; interno: boolean }) {
  const r = d.resultado;
  if (!r) return null;
  const f = r.finanzas;
  const ops = [...r.oportunidades].sort((a, b) => a.prioridad - b.prioridad);
  const fecha = new Date(d.analizado_at ?? d.updated_at).toLocaleDateString("es", { dateStyle: "long" });

  return (
    <article className="space-y-6">
      <header className="card">
        <p className="text-sm font-medium text-brand-700">Diagnóstico de IA y automatización</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{d.empresa}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {d.respuestas.empresa.industria || "—"} · {d.respuestas.empresa.empleados} empleados · {fecha}
        </p>
        <p className="mt-4 leading-relaxed text-slate-700">{r.resumen_ejecutivo}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Madurez digital" value={`${Math.round(r.madurez.puntaje)}/100`} sub={r.madurez.nivel} />
        <Kpi label="Horas liberadas/mes" value={`${Math.round(f.horas_ahorradas_mes)} h`} sub={`de ${Math.round(f.horas_actuales_mes)} h actuales`} />
        <Kpi label="Ahorro mensual" value={usd(f.ahorro_mensual_usd)} sub={`a ${usd(f.costo_hora_empleado_usd)}/h`} />
        <Kpi label="Inversión" value={usd(f.inversion_implementacion_usd)} sub={`${Math.round(f.total_horas)} h · ${f.semanas_totales} semanas`} />
        <Kpi label="Recuperación" value={f.roi_meses != null ? `${f.roi_meses} meses` : "N/A"} sub={`neto ${usd(f.beneficio_neto_mensual_usd)}/mes`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="h2 mb-4">Madurez por dimensión</h2>
          <ul className="space-y-4">
            {r.madurez.dimensiones.map((dim) => (
              <li key={dim.nombre}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{dim.nombre}</span>
                  <span className="text-slate-500">{Math.round(dim.puntaje)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(0, dim.puntaje))}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{dim.comentario}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card space-y-5">
          <div>
            <h2 className="h2 mb-2">Hallazgos clave</h2>
            <Lista items={r.hallazgos} />
          </div>
          <div>
            <h2 className="h2 mb-2">Quick wins</h2>
            <Lista items={r.quick_wins} />
          </div>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="h2 mb-4">Oportunidades priorizadas</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Oportunidad</th>
              <th className="py-2 pr-3">Área</th>
              <th className="py-2 pr-3">Impacto</th>
              <th className="py-2 pr-3">Esfuerzo</th>
              <th className="py-2 pr-3 text-right">h/mes</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 text-slate-500">{o.prioridad}</td>
                <td className="py-2 pr-3">
                  <a href={`#${o.id}`} className="font-medium text-slate-900 hover:text-brand-700">{o.titulo}</a>
                  {o.usa_ia && <span className="chip ml-2 bg-violet-100 text-violet-800">IA</span>}
                </td>
                <td className="py-2 pr-3 text-slate-600">{o.area}</td>
                <td className="py-2 pr-3"><span className={`chip ${nivelColor[o.impacto]}`}>{o.impacto}</span></td>
                <td className="py-2 pr-3"><span className={`chip ${esfuerzoColor[o.esfuerzo]}`}>{o.esfuerzo}</span></td>
                <td className="py-2 pr-3 text-right tabular-nums">{Math.round(o.horas_ahorradas_mes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <h2 className="h2 page-break">Flujos de automatización en n8n</h2>
        {ops.map((o) => (
          <OportunidadCard key={o.id} o={o} token={d.public_token} />
        ))}
      </section>

      <section className="card overflow-x-auto page-break">
        <h2 className="h2 mb-1">Stack de herramientas</h2>
        <p className="mb-4 text-sm text-slate-600">{r.arquitectura}</p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">Herramienta</th>
              <th className="py-2 pr-3">Uso</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3 text-right">USD/mes</th>
            </tr>
          </thead>
          <tbody>
            {r.stack.map((h) => (
              <tr key={h.herramienta} className="border-b border-slate-100 align-top last:border-0">
                <td className="py-2 pr-3">
                  <p className="font-medium text-slate-900">{h.herramienta}</p>
                  <p className="text-xs text-slate-500">
                    {h.categoria}
                    {h.ya_la_tienen && " · ya la usan"}
                    {!h.obligatoria && " · opcional"}
                  </p>
                </td>
                <td className="py-2 pr-3 text-slate-600">
                  {h.uso}
                  {h.alternativa && <span className="block text-xs text-slate-400">Alternativa: {h.alternativa}</span>}
                </td>
                <td className="py-2 pr-3 text-slate-600">{h.plan_sugerido}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{h.ya_la_tienen ? "—" : usd(h.costo_mensual_usd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-semibold">
              <td className="py-2 pr-3" colSpan={3}>Costo mensual adicional estimado</td>
              <td className="py-2 pr-3 text-right tabular-nums">{usd(f.costo_mensual_herramientas_usd)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card page-break">
        <h2 className="h2 mb-1">Propuesta de implementación</h2>
        <p className="mb-5 text-sm text-slate-600">{r.propuesta.enfoque}</p>
        <ol className="space-y-4">
          {r.propuesta.fases.map((fase, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-900">Fase {i + 1}: {fase.nombre}</p>
                <p className="text-sm text-slate-500">
                  {fase.duracion_semanas} sem · {fase.horas} h · {usd(fase.horas * f.tarifa_hora_usd)}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{fase.objetivo}</p>
              <Lista items={fase.entregables} className="mt-2" />
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Kpi label="Implementación" value={usd(f.inversion_implementacion_usd)} sub={`${Math.round(f.total_horas)} h × ${usd(f.tarifa_hora_usd)}`} />
          <Kpi label="Soporte y mejora continua" value={`${usd(f.soporte_mensual_usd)}/mes`} sub={`${r.propuesta.soporte_mensual_horas} h/mes`} />
          <Kpi label="Herramientas" value={`${usd(f.costo_mensual_herramientas_usd)}/mes`} sub="pago directo a proveedores" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div><p className="mb-2 font-semibold text-slate-900">Supuestos</p><Lista items={r.propuesta.supuestos} /></div>
          <div><p className="mb-2 font-semibold text-slate-900">Exclusiones</p><Lista items={r.propuesta.exclusiones} /></div>
          <div><p className="mb-2 font-semibold text-slate-900">Siguientes pasos</p><Lista items={r.propuesta.siguientes_pasos} /></div>
        </div>
      </section>

      {interno && r.preguntas_pendientes.length > 0 && (
        <section className="card no-print border-amber-200 bg-amber-50">
          <h2 className="h2 mb-2">Preguntas a validar con el cliente (interno)</h2>
          <Lista items={r.preguntas_pendientes} />
        </section>
      )}

      <p className="text-center text-xs text-slate-400">
        Estimaciones generadas con IA a partir de la información declarada; deben validarse antes de la implementación.
      </p>
    </article>
  );
}

function OportunidadCard({ o, token }: { o: Oportunidad; token: string }) {
  const flujo = o.flujo_n8n;
  return (
    <div id={o.id} className="card scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Prioridad {o.prioridad} · {o.area} · {o.proceso_origen}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{o.titulo}</h3>
        </div>
        <a href={`/api/n8n/${token}/${o.id}`} className="btn-secondary no-print" download>
          ⬇ JSON n8n
        </a>
      </div>
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="font-medium text-slate-900">Problema</p><p className="text-slate-600">{o.problema}</p></div>
        <div><p className="font-medium text-slate-900">Solución</p><p className="text-slate-600">{o.solucion}</p></div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{flujo.nombre}</p>
        <p className="text-xs text-slate-500">Disparador: {flujo.disparador}</p>
        <ol className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {flujo.nodos.map((n, i) => (
            <li key={n.ref} className="flex items-center gap-2">
              <span
                title={`${n.tipo}\n${n.descripcion}`}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700"
              >
                {n.nombre}
              </span>
              {i < flujo.nodos.length - 1 && <span className="text-slate-300">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="mb-1 font-medium text-slate-900">Herramientas</p>
          <div className="flex flex-wrap gap-1">
            {o.herramientas.map((h) => <span key={h} className="chip bg-slate-100 text-slate-700">{h}</span>)}
          </div>
        </div>
        <div><p className="mb-1 font-medium text-slate-900">KPIs</p><Lista items={o.kpis} /></div>
        <div><p className="mb-1 font-medium text-slate-900">Riesgos</p><Lista items={o.riesgos} /></div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Lista({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`list-disc space-y-1 pl-5 text-sm text-slate-600 ${className}`}>
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  );
}
