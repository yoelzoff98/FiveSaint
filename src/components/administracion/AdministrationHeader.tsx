"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogOut, User, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface AdministrationHeaderProps {
  profileName?: string;
  isAdmin?: boolean;
}

export function AdministrationHeader({ profileName = "Administración", isAdmin = false }: AdministrationHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/administracion/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 hidden sm:inline">
          Five Saint
        </span>
        <span className="text-stone-300 hidden sm:inline">/</span>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge variant="outline" className="border-accent-gold text-amber-800 bg-amber-50/70 font-semibold text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-700" />
              ADMIN Central
            </Badge>
          ) : (
            <Badge variant="outline" className="border-accent-deep/40 text-accent-deep bg-sky-50 font-semibold text-xs flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-accent-deep" />
              Administración
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-right">
          <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-stone-800 hidden md:inline">
            {profileName}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-stone-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5 text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
}
