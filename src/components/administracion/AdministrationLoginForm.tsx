"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export function AdministrationLoginForm() {
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
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      setError("Credenciales incorrectas. Verificá tu correo electrónico y contraseña.");
      setLoading(false);
      return;
    }

    // 2. Verificar autorización: ADMIN activo o Administración activa
    const [adminCheck, adminStaffCheck] = await Promise.all([
      supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("administration_users")
        .select("id, is_active")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
    ]);

    const isAdmin = Boolean(adminCheck.data?.is_active);
    const isAdministration = Boolean(adminStaffCheck.data?.is_active);

    if (!isAdmin && !isAdministration) {
      await supabase.auth.signOut();
      setError("Acceso denegado: Tu cuenta no posee permisos activos para el Portal de Administración.");
      setLoading(false);
      return;
    }

    // 3. Redirigir al portal de administración
    router.push("/administracion");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200/80">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent-deep/10 border border-accent-deep/20 text-accent-deep mx-auto flex items-center justify-center mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight uppercase">
          Five Saint
        </h1>
        <p className="text-xs font-bold text-accent-gold uppercase tracking-widest mt-1">
          Portal de Administración
        </p>
        <p className="text-stone-500 text-xs mt-2">
          Ingresá con tu cuenta autorizada para gestionar presupuestos y pedidos.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@fivesaint.com"
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-accent-deep focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-accent-deep focus:bg-white transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full py-2.5 mt-2 bg-accent-deep hover:bg-accent-hover text-white font-semibold text-sm flex items-center justify-center gap-2 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validando permisos...
            </span>
          ) : (
            <>
              <span>Ingresar al Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 pt-4 border-t border-stone-100 text-center text-[11px] text-stone-400">
        Acceso restringido exclusivamente a personal autorizado de Five Saint S.A.
      </div>
    </div>
  );
}
