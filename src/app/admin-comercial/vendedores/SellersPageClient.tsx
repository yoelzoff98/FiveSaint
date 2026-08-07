"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, ShieldAlert, Plus, X, Power, UserCheck } from "lucide-react";
import { registerSellerAction } from "./actions";
import { toggleSellerActive } from "@/lib/supabase/comercial";

interface Seller {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface SellersPageClientProps {
  initialSellers: Seller[];
}

export function SellersPageClient({ initialSellers }: SellersPageClientProps) {
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPassword("");
    setUsername("");
    setFullName("");
    setEmail("");
    setShowForm(false);
    setError(null);
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await registerSellerAction({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim()
      });

      if (res && res.success && res.seller) {
        setSellers(prev => [...prev, res.seller]);
        resetForm();
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar el vendedor.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (seller: Seller) => {
    setLoading(true);
    setError(null);
    const newStatus = !seller.is_active;

    try {
      await toggleSellerActive(seller.id, newStatus);

      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, is_active: newStatus } : s));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar estado del vendedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Guía informativa de autocreación */}
      <div className="bg-stone-900 text-white p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3 border border-stone-850">
        <UserCheck className="w-5 h-5 text-accent-deep mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block mb-1">Registro Directo de Vendedores:</span>
          Ahora podés crear las cuentas de tus vendedores directamente ingresando su email y contraseña aquí. El sistema registrará el acceso y creará las credenciales automáticamente sin necesidad de ingresar al panel de Supabase.
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-stone-900">Listado de Vendedores</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Registrar Vendedor
          </Button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="p-6 border-stone-200 bg-white shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-stone-900">Vincular Perfil de Vendedor</h3>
            <button onClick={resetForm} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateSeller} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Contraseña de Acceso *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Nombre de Usuario Comercial *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="juan_ventas"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Nombre Completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="Juan Carlos Pérez"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Email de Acceso *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="juan@fivesaint.com"
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="cursor-pointer">
                {loading ? "Registrando..." : "Vincular Vendedor"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de Vendedores */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {sellers.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm italic">
            No hay vendedores vinculados todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">ID de Autenticación (Supabase)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-stone-400" />
                        {s.full_name}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {s.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-600">
                      @{s.username}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-400 select-all">
                      {s.user_id}
                    </td>
                    <td className="px-6 py-4">
                      {s.is_active ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={s.is_active ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => handleToggleActive(s)}
                        disabled={loading}
                        className={`cursor-pointer ${
                          s.is_active ? "text-red-650 hover:bg-red-50" : "text-green-750 hover:bg-green-50"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {s.is_active ? "Desactivar Acceso" : "Activar Acceso"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
