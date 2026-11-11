import DiagnosticForm from "@/components/DiagnosticForm";

export const metadata = { title: "Diagnóstico" };

export default function Page() {
  return (
    <main className="px-4 py-10">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Diagnóstico de IA y automatización</h1>
        <p className="mt-2 text-slate-600">
          Toma unos 10 minutos. Cuanto más detalle des sobre tus procesos, más preciso será el informe.
        </p>
      </div>
      <DiagnosticForm modo="publico" />
    </main>
  );
}
