"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { accountingContext } from "@/lib/supabase/accounting";
export function AccountingLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const db = createSupabaseBrowserClient();
      const { error } = await db.auth.signInWithPassword({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (error) throw new Error("Correo o contraseña incorrectos");
      if (!(await accountingContext())) {
        await db.auth.signOut();
        throw new Error("Tu cuenta no tiene acceso activo al Portal Contable");
      }
      router.replace("/contable");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ingresar");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="w-full max-w-md bg-white border rounded-2xl p-8 shadow-sm">
      <p className="text-sm text-teal-700 font-semibold">FIVE SAINT</p>
      <h1 className="text-2xl font-bold mt-2">Portal Contable</h1>
      <p className="text-stone-500 mt-2 mb-6">
        Consulta de comprobantes fiscales autorizados.
      </p>
      <form onSubmit={login} className="space-y-4">
        <label className="block">
          Correo electrónico
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="block border rounded p-2 w-full"
          />
        </label>
        <label className="block">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="block border rounded p-2 w-full"
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="bg-teal-700 text-white rounded px-4 py-2 w-full"
        >
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </section>
  );
}
