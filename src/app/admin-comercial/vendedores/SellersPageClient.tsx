"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Plus, X, Power, UserCheck, BarChart3, Phone, Edit } from "lucide-react";
import { registerSellerAction, updateSellerAction } from "./actions";
import { toggleSellerActive } from "@/lib/supabase/comercial";

interface Seller {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string | null;
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
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  // Registration Form State
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Edit Form State
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPassword("");
    setUsername("");
    setFullName("");
    setEmail("");
    setPhone("");
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
        password: password.trim(),
        phone: phone.trim()
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

  const startEditSeller = (seller: Seller) => {
    setEditingSeller(seller);
    setEditFullName(seller.full_name);
    setEditEmail(seller.email);
    setEditPhone(seller.phone || "");
    setError(null);
  };

  const handleUpdateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeller || !editFullName.trim() || !editEmail.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await updateSellerAction(editingSeller.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim()
      });

      if (res && res.success && res.seller) {
        setSellers(prev => prev.map(s => s.id === editingSeller.id ? res.seller : s));
        setEditingSeller(null);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar el vendedor.");
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
          <span className="font-bold block mb-1">Registro y Edición Directa de Vendedores:</span>
          Podés registrar vendedores asignando su usuario, contraseña y número de WhatsApp comercial. Este WhatsApp será utilizado automáticamente en las cotizaciones y presupuestos PDF oficiales de Five Saint.
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-stone-900">Listado de Vendedores</h2>
        {!showForm && !editingSeller && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Registrar Vendedor
          </Button>
        )}
      </div>

      {/* Formulario de Registro */}
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
                placeholder="tamara_diaz"
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
                placeholder="Tamara Diaz"
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
                placeholder="tamara@fivesaint.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-semibold text-stone-750">WhatsApp / Teléfono Comercial (Aparecerá en el PDF del Presupuesto)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="+54 9 11 1234-5678"
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

      {/* Formulario de Edición */}
      {editingSeller && (
        <Card className="p-6 border-stone-200 bg-amber-50/30 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-stone-900">Editar Perfil de Vendedor: @{editingSeller.username}</h3>
            <button onClick={() => setEditingSeller(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdateSeller} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Nombre Completo *</label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">Email de Acceso *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-stone-750">WhatsApp / Teléfono (PDF)</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setEditingSeller(null)} disabled={loading} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="cursor-pointer">
                {loading ? "Guardando..." : "Guardar Cambios"}
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
                  <th className="px-6 py-4">WhatsApp Comercial</th>
                  <th className="px-6 py-4">Usuario</th>
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
                    <td className="px-6 py-4">
                      {s.phone ? (
                        <div className="flex items-center gap-1.5 font-medium text-green-700 text-xs bg-green-50 px-2.5 py-1 rounded border border-green-200 inline-flex">
                          <Phone className="w-3.5 h-3.5 text-green-600" />
                          {s.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No asignado (+54 9 11 3816-1492 default)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-600">
                      @{s.username}
                    </td>
                    <td className="px-6 py-4">
                      {s.is_active ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditSeller(s)}
                          className="cursor-pointer text-stone-700 hover:text-stone-900"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin-comercial/vendedores/${s.id}`)}
                          className="cursor-pointer text-stone-700 hover:text-stone-900"
                        >
                          <BarChart3 className="w-3.5 h-3.5 mr-1" />
                          Ver Desempeño
                        </Button>
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
                          {s.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
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
