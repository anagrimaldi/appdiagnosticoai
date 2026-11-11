import { notFound } from "next/navigation";
import DiagnosticForm from "@/components/DiagnosticForm";
import { AnswersSchema } from "@/lib/questionnaire";
import { createClient } from "@/lib/supabase/server";

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("diagnosticos").select("respuestas, empresa").eq("id", id).single();
  if (!data) notFound();
  const inicial = AnswersSchema.parse(data.respuestas);
  return (
    <>
      <h1 className="mx-auto mb-6 max-w-3xl text-2xl font-bold text-slate-900">Editar: {data.empresa}</h1>
      <DiagnosticForm modo="consultor" inicial={inicial} diagnosticoId={id} />
    </>
  );
}
