"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ShoppingBag, X, ExternalLink, Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  order_id: string;
  title: string;
  message: string;
  created_at: string;
}

export function RealtimeNotificationToast({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Solo admins reciben notificaciones globales de ventas
    if (!isAdmin) return;

    const supabase = createSupabaseBrowserClient();

    // 1. Escuchar eventos INSERT en la tabla public.notifications en tiempo real
    const channel = supabase
      .channel("realtime-orders-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setToastNotification(newNotif);
          setUnreadCount((prev) => prev + 1);

          // Reproducir un sonido discreto de notificación si el navegador lo permite
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (!toastNotification) return null;

  const handleNotificationClick = () => {
    if (toastNotification.order_id) {
      router.push(`/admin-comercial/pedidos/${toastNotification.order_id}`);
    } else {
      router.push(`/admin-comercial/pedidos`);
    }
    setToastNotification(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in shadow-2xl">
      <div 
        onClick={handleNotificationClick}
        className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-700 cursor-pointer hover:bg-stone-850 transition-all flex flex-col gap-3 group relative overflow-hidden"
      >
        {/* Barra superior decorativa verde exito */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                {toastNotification.title}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>
              <p className="text-stone-300 text-xs mt-0.5 line-clamp-2">
                {toastNotification.message}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastNotification(null);
            }}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[11px] text-emerald-400 font-semibold group-hover:underline">
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Hacé clic para ver el pedido y bajar a fábrica
          </span>
          <span className="text-stone-400 font-normal">Ahora</span>
        </div>
      </div>
    </div>
  );
}
