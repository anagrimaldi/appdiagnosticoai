"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/panel";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales inválidas");
      setLoading(false);
      return;
    }
    router.push(next.startsWith("/") ? next : "/panel");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Acceso consultores</h1>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pw">Contraseña</label>
        <input id="pw" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
