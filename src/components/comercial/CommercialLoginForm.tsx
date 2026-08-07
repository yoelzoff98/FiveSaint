"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";

export function CommercialLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    
    // 1. Iniciar sesión en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Credenciales incorrectas. Verificá tu email y contraseña.");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Verificar si es administrador activo
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("user_id", userId)
      .single();

    if (adminUser && adminUser.is_active) {
      router.push("/admin-comercial/dashboard");
      router.refresh();
      return;
    }

    // 3. Verificar si es vendedor activo
    const { data: sellerUser } = await supabase
      .from("sellers")
      .select("is_active")
      .eq("user_id", userId)
      .single();

    if (sellerUser && sellerUser.is_active) {
      router.push("/admin-comercial/dashboard");
      router.refresh();
      return;
    }

    // 4. Si no es admin ni vendedor activo, cerrar sesión inmediatamente
    await supabase.auth.signOut();
    setError("No tenés permisos comerciales activos para acceder a este panel.");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-stone-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-wide uppercase">Five Saint</h1>
        <p className="text-stone-500 text-sm mt-2">Seguimiento Comercial y Ventas</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700" htmlFor="email">
            Email de acceso
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-deep focus:border-transparent text-stone-800"
            placeholder="vendedor@fivesaint.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-deep focus:border-transparent text-stone-800"
            placeholder="••••••••"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-4 h-12 cursor-pointer"
          disabled={loading}
        >
          {loading ? "Verificando..." : "Ingresar al Panel Comercial"}
        </Button>
      </form>
    </div>
  );
}
