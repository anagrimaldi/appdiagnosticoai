import Link from "next/link";
import { getUser } from "@/lib/supabase/server";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Diagnóstico IA";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/panel" className="font-bold text-slate-900">
            {brand} <span className="font-normal text-slate-400">· Panel</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/panel/nuevo" className="btn-primary">+ Nuevo diagnóstico</Link>
            <span className="hidden text-slate-500 sm:inline">{user?.email}</span>
            <form action="/api/auth/logout" method="post">
              <button className="btn-ghost">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
