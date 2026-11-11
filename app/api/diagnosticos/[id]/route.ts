import { NextResponse } from "next/server";
import { z } from "zod";
import { AnswersSchema } from "@/lib/questionnaire";
import { ESTADOS } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const Patch = z.object({
  notas_consultor: z.string().max(10000).optional(),
  tarifa_hora_usd: z.coerce.number().min(0).max(10000).optional(),
  estado: z.enum(Object.keys(ESTADOS) as [keyof typeof ESTADOS, ...(keyof typeof ESTADOS)[]]).optional(),
  respuestas: AnswersSchema.optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.respuestas) {
    update.empresa = parsed.data.respuestas.empresa.nombre;
    update.contacto_nombre = parsed.data.respuestas.contacto.nombre;
    update.contacto_email = parsed.data.respuestas.contacto.email;
  }
  const { error } = await supabase.from("diagnosticos").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { error } = await supabase.from("diagnosticos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
