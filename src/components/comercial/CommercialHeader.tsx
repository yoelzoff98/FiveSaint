"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface CommercialHeaderProps {
  profileName: string;
}

export function CommercialHeader({ profileName }: CommercialHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin-comercial/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
      <div className="font-semibold text-stone-800 tracking-wide">
        Seguimiento Comercial
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full font-medium">
          <User className="w-4 h-4 text-stone-500" />
          <span>{profileName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
