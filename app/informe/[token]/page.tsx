import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import Report from "@/components/Report";
import type { Diagnostico } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Informe", robots: { index: false, follow: false } };

const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Diagnóstico IA";

export default async function Informe({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { data } = await createAdminClient().from("diagnosticos").select("*").eq("public_token", token).single();
  if (!data?.resultado) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <span className="font-bold text-slate-900">{brand}</span>
        <PrintButton />
      </div>
      <Report d={data as Diagnostico} interno={false} />
    </main>
  );
}
