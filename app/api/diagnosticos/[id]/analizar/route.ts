import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeDiagnostic, AnalysisError, MODEL } from "@/lib/analyze";
import { calcularFinanzas } from "@/lib/finance";
import { AnswersSchema } from "@/lib/questionnaire";
import type { StoredResult } from "@/lib/result-schema";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // el análisis puede tardar 1-4 minutos

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: d, error } = await supabase
    .from("diagnosticos")
    .select("respuestas, notas_consultor, tarifa_hora_usd, estado")
    .eq("id", id)
    .single();
  if (error || !d) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const answers = AnswersSchema.safeParse(d.respuestas);
  if (!answers.success) return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });

  const estadoPrevio = d.estado === "analizando" ? "en_revision" : d.estado;
  await supabase.from("diagnosticos").update({ estado: "analizando", error_analisis: null }).eq("id", id);

  try {
    const result = await analyzeDiagnostic(answers.data, d.notas_consultor);
    const stored: StoredResult = {
      ...result,
      modelo: MODEL,
      finanzas: calcularFinanzas(result, answers.data, Number(d.tarifa_hora_usd)),
    };
    await supabase
      .from("diagnosticos")
      .update({
        resultado: stored,
        estado: ["recibido", "en_revision", "analizando"].includes(estadoPrevio) ? "analizado" : estadoPrevio,
        analizado_at: new Date().toISOString(),
      })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    let msg = "Error inesperado al analizar";
    if (e instanceof AnalysisError) msg = e.message;
    else if (e instanceof Anthropic.AuthenticationError) msg = "API key de Anthropic inválida";
    else if (e instanceof Anthropic.RateLimitError) msg = "Límite de uso de la API alcanzado; reintenta en unos minutos";
    else if (e instanceof Anthropic.APIError) msg = `Error de la API (${e.status}): ${e.message}`;
    console.error("analizar", e);
    await supabase.from("diagnosticos").update({ estado: estadoPrevio, error_analisis: msg }).eq("id", id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
