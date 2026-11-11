import Link from "next/link";

export default function Gracias() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="card">
        <p className="text-4xl">✅</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">¡Diagnóstico recibido!</h1>
        <p className="mt-2 text-slate-600">
          Analizaremos tu información y te contactaremos en las próximas 48 horas con tu informe de oportunidades
          de automatización.
        </p>
        <Link href="/" className="btn-secondary mt-6">Volver al inicio</Link>
      </div>
    </main>
  );
}
