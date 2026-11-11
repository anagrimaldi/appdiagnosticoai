import { NextResponse } from "next/server";
import { buildN8nWorkflow, slug } from "@/lib/n8n";
import { getFlujo, type StoredResult } from "@/lib/result-schema";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ token: string; opId: string }> }) {
  const { token, opId } = await ctx.params;
  if (!UUID.test(token)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data } = await createAdminClient()
    .from("diagnosticos")
    .select("empresa, resultado")
    .eq("public_token", token)
    .single();
  const result = data?.resultado as StoredResult | null;
  const op = result?.oportunidades.find((o) => o.id === opId);
  const flujo = result && op ? getFlujo(result, op.id) : null;
  if (!op || !flujo) return NextResponse.json({ error: "Flujo no generado" }, { status: 404 });

  const wf = buildN8nWorkflow(op, flujo);
  return new NextResponse(JSON.stringify(wf, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug(data!.empresa)}-${op.id}-${slug(flujo.nombre)}.json"`,
    },
  });
}
