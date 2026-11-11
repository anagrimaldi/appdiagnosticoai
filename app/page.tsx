import Link from "next/link";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Diagnóstico IA";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-16">
      <span className="chip mb-4 w-fit bg-brand-100 text-brand-700">{brand}</span>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Descubre qué procesos de tu empresa puedes automatizar con IA
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Completa un diagnóstico de 10 minutos. Analizamos tus procesos y te entregamos un informe con
        oportunidades priorizadas, flujos de automatización en n8n, herramientas recomendadas y retorno estimado.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/diagnostico" className="btn-primary px-6 py-3 text-base">
          Iniciar diagnóstico
        </Link>
        <Link href="/panel" className="btn-secondary px-6 py-3 text-base">
          Acceso consultores
        </Link>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          ["1. Levantamiento", "Empresa, herramientas, procesos y objetivos."],
          ["2. Análisis con IA", "Madurez digital y oportunidades priorizadas por impacto."],
          ["3. Plan de acción", "Flujos n8n, stack de herramientas y propuesta con ROI."],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <p className="font-semibold text-slate-900">{t}</p>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
