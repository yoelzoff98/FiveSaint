"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin-FiveSaint/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
      <div className="font-semibold text-stone-800 tracking-wide">
        Panel de Administración
      </div>
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </header>
  );
}
