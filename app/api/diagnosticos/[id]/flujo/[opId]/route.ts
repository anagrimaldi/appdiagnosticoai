import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AnalysisError, designFlow } from "@/lib/analyze";
import { AnswersSchema } from "@/lib/questionnaire";
import type { StoredResult } from "@/lib/result-schema";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

/** Genera (o regenera) bajo demanda el flujo n8n de una oportunidad. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string; opId: string }> }) {
  const { id, opId } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY en .env.local" }, { status: 500 });
  }

  const { data: d } = await supabase
    .from("diagnosticos")
    .select("respuestas, notas_consultor, resultado")
    .eq("id", id)
    .single();
  const result = d?.resultado as StoredResult | null;
  const op = result?.oportunidades.find((o) => o.id === opId);
  if (!d || !result || !op) return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 });

  const answers = AnswersSchema.safeParse(d.respuestas);
  if (!answers.success) return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });

  try {
    const flujo = await designFlow(answers.data, d.notas_consultor, result, op);

    // Se relee el resultado justo antes de guardar para no pisar flujos generados en paralelo.
    const { data: actual } = await supabase.from("diagnosticos").select("resultado").eq("id", id).single();
    const latest = actual?.resultado as StoredResult | null;
    if (!latest?.oportunidades.some((o) => o.id === opId)) {
      return NextResponse.json({ error: "El análisis cambió mientras se generaba el flujo; reintenta." }, { status: 409 });
    }
    latest.flujos = { ...(latest.flujos ?? {}), [opId]: flujo };
    const { error } = await supabase.from("diagnosticos").update({ resultado: latest }).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    let msg = `Error al diseñar el flujo: ${e instanceof Error ? e.message : String(e)}`;
    if (e instanceof AnalysisError) msg = e.message;
    else if (e instanceof Anthropic.AuthenticationError) msg = "API key de Anthropic inválida";
    else if (e instanceof Anthropic.RateLimitError) msg = "Límite de uso de la API alcanzado; reintenta en unos minutos";
    else if (e instanceof Anthropic.APIConnectionError) msg = "No se pudo conectar con la API de Anthropic.";
    else if (e instanceof Anthropic.APIError) msg = `Error de la API (${e.status}): ${e.message}`;
    console.error("flujo", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
