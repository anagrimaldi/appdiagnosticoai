import Link from "next/link";
import { ESTADOS, type Diagnostico } from "@/lib/data";
import { usd } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const estadoColor: Record<string, string> = {
  recibido: "bg-sky-100 text-sky-800",
  en_revision: "bg-slate-100 text-slate-700",
  analizando: "bg-violet-100 text-violet-800",
  analizado: "bg-emerald-100 text-emerald-800",
  propuesta_enviada: "bg-amber-100 text-amber-800",
  ganado: "bg-green-600 text-white",
  perdido: "bg-red-100 text-red-700",
};

export default async function Panel() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diagnosticos")
    .select("id, created_at, origen, estado, empresa, contacto_nombre, contacto_email, resultado")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Pick<
    Diagnostico,
    "id" | "created_at" | "origen" | "estado" | "empresa" | "contacto_nombre" | "contacto_email" | "resultado"
  >[];

  const analizados = rows.filter((r) => r.resultado);
  const pipeline = analizados.reduce((s, r) => s + (r.resultado?.finanzas.inversion_implementacion_usd ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Diagnósticos" value={String(rows.length)} />
        <Stat label="Pendientes de análisis" value={String(rows.filter((r) => !r.resultado).length)} />
        <Stat label="Pipeline propuesto" value={usd(pipeline)} />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Inversión</th>
              <th className="px-4 py-3 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Aún no hay diagnósticos. Comparte el enlace <code>/diagnostico</code> o crea uno nuevo.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3"><Link href={`/panel/${r.id}`} className="font-medium text-slate-900 hover:text-brand-700">{r.empresa}</Link></td>
                <td className="px-4 py-3 text-slate-600">{r.contacto_nombre}<span className="block text-xs text-slate-400">{r.contacto_email}</span></td>
                <td className="px-4 py-3 text-slate-600">{r.origen === "cliente" ? "Autoservicio" : "Consultor"}</td>
                <td className="px-4 py-3"><span className={`chip ${estadoColor[r.estado]}`}>{ESTADOS[r.estado]}</span></td>
                <td className="px-4 py-3 text-right tabular-nums">{r.resultado ? usd(r.resultado.finanzas.inversion_implementacion_usd) : "—"}</td>
                <td className="px-4 py-3 text-right text-slate-500">{new Date(r.created_at).toLocaleDateString("es")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
