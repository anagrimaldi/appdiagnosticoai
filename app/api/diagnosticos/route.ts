import { NextResponse } from "next/server";
import { z } from "zod";
import { AnswersSchema } from "@/lib/questionnaire";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

const Body = z.object({
  respuestas: AnswersSchema,
  notas: z.string().max(5000).optional(),
  hp: z.string().optional(), // honeypot anti-spam
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { respuestas, notas, hp } = parsed.data;
  if (hp) return NextResponse.json({ ok: true }); // bot: se descarta en silencio

  const user = await getUser();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("diagnosticos")
    .insert({
      origen: user ? "consultor" : "cliente",
      estado: user ? "en_revision" : "recibido",
      empresa: respuestas.empresa.nombre,
      contacto_nombre: respuestas.contacto.nombre,
      contacto_email: respuestas.contacto.email,
      respuestas,
      notas_consultor: user ? (notas ?? null) : null,
      tarifa_hora_usd: Number(process.env.DEFAULT_HOURLY_RATE_USD ?? 40),
      owner_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "No se pudo guardar el diagnóstico" }, { status: 500 });

  const hook = process.env.N8N_NOTIFY_WEBHOOK_URL;
  if (hook) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evento: "diagnostico_nuevo",
        id: data.id,
        origen: user ? "consultor" : "cliente",
        empresa: respuestas.empresa.nombre,
        contacto: respuestas.contacto,
        procesos: respuestas.procesos.length,
        url_panel: `${site}/panel/${data.id}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: user ? data.id : undefined });
}
