import { notFound } from "next/navigation";
import PanelActions from "@/components/PanelActions";
import Report from "@/components/Report";
import { ESTADOS, type Diagnostico } from "@/lib/data";
import { FRECUENCIAS, USO_IA, horasMes } from "@/lib/questionnaire";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("diagnosticos").select("*").eq("id", id).single();
  if (!data) notFound();
  const d = data as Diagnostico;
  const a = d.respuestas;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        {d.resultado ? (
          <Report d={d} interno />
        ) : (
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900">{d.empresa}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sin análisis todavía. Revisa las respuestas, agrega notas y genera el diagnóstico.
            </p>
          </div>
        )}

        <details className="card no-print" open={!d.resultado}>
          <summary className="cursor-pointer font-semibold text-slate-900">Respuestas del levantamiento</summary>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Item k="Empresa" v={`${a.empresa.nombre} · ${a.empresa.industria || "—"} · ${a.empresa.empleados} empleados · ${a.empresa.pais || "—"}`} />
            <Item k="Contacto" v={`${a.contacto.nombre} (${a.contacto.cargo || "—"}) · ${a.contacto.email} · ${a.contacto.telefono || "—"}`} />
            <Item k="Descripción" v={a.empresa.descripcion || "—"} />
            <Item k="Herramientas" v={[...a.madurez.herramientas, a.madurez.otras_herramientas].filter(Boolean).join(", ") || "—"} />
            <Item k="Uso de IA" v={USO_IA[a.madurez.uso_ia]} />
            <Item k="Datos / integraciones / equipo técnico" v={`${a.madurez.datos_centralizados} / ${a.madurez.integraciones} / ${a.madurez.equipo_tecnico}`} />
            <Item k="Objetivos" v={a.objetivos.objetivos.join(", ") || "—"} />
            <Item k="Prioridad 90 días" v={a.objetivos.prioridad || "—"} />
            <Item k="Presupuestos (herramientas / implementación)" v={`${a.objetivos.presupuesto_herramientas_usd || "—"} / ${a.objetivos.presupuesto_implementacion_usd || "—"} USD`} />
            <Item k="Hosting n8n · Plazo · Costo hora empleado" v={`${a.objetivos.hosting_n8n} · ${a.objetivos.plazo || "—"} · ${a.objetivos.costo_hora_empleado_usd} USD`} />
            <Item k="Restricciones" v={a.objetivos.restricciones || "—"} />
          </div>
          <h3 className="mt-6 font-semibold text-slate-900">Procesos</h3>
          <div className="mt-2 space-y-3">
            {a.procesos.map((p, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-900">{p.nombre} <span className="font-normal text-slate-500">· {p.area} · {FRECUENCIAS[p.frecuencia]} ×{p.veces_por_periodo} · {p.minutos_por_ejecucion} min · {p.personas} pers. · ≈{horasMes(p).toFixed(1)} h/mes</span></p>
                {p.descripcion && <p className="mt-1 text-slate-600">{p.descripcion}</p>}
                {p.dolor && <p className="mt-1 text-slate-600"><strong>Dolor:</strong> {p.dolor}</p>}
                {p.herramientas && <p className="mt-1 text-slate-500">Herramientas: {p.herramientas}</p>}
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <PanelActions
          id={d.id}
          token={d.public_token}
          estado={d.estado}
          estados={ESTADOS}
          notas={d.notas_consultor ?? ""}
          tarifa={Number(d.tarifa_hora_usd)}
          tieneResultado={!!d.resultado}
          errorAnalisis={d.error_analisis}
        />
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</p>
      <p className="text-slate-800">{v}</p>
    </div>
  );
}
