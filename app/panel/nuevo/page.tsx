import DiagnosticForm from "@/components/DiagnosticForm";

export default function Nuevo() {
  return (
    <>
      <h1 className="mx-auto mb-6 max-w-3xl text-2xl font-bold text-slate-900">Nuevo diagnóstico</h1>
      <DiagnosticForm modo="consultor" />
    </>
  );
}
