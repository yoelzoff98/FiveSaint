"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Bell, ShoppingBag, Check } from "lucide-react";

interface NotificationItem {
  id: string;
  order_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function CommercialNotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data as NotificationItem[]);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("realtime-header-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createSupabaseBrowserClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleSelectNotification = (n: NotificationItem) => {
    handleMarkAsRead(n.id, { stopPropagation: () => {} } as any);
    setIsOpen(false);
    if (n.order_id) {
      router.push(`/admin-comercial/pedidos/${n.order_id}`);
    } else {
      router.push(`/admin-comercial/pedidos`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
        title="Notificaciones de ventas"
      >
        <Bell className="w-5 h-5 text-stone-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-stone-150 flex items-center justify-between bg-stone-50">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-deep" />
              Notificaciones de Ventas
            </h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold text-accent-deep bg-accent-deep/10 px-2 py-0.5 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No hay notificaciones registradas.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleSelectNotification(n)}
                  className={`p-4 transition-colors cursor-pointer hover:bg-stone-50 flex items-start justify-between gap-3 ${
                    !n.is_read ? "bg-amber-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-stone-900">{n.title}</div>
                      <div className="text-xs text-stone-600 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        {new Date(n.created_at).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="text-stone-400 hover:text-emerald-600 p-1 rounded transition-colors shrink-0"
                      title="Marcar como leída"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-stone-50 border-t border-stone-150 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/admin-comercial/pedidos");
              }}
              className="text-xs font-semibold text-accent-deep hover:underline cursor-pointer"
            >
              Ver todos los pedidos a fábrica →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
