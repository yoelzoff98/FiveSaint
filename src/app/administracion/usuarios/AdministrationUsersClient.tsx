"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  UserPlus,
  UserCheck,
  Power,
  Edit,
  Mail,
  Lock,
  User,
  AlertCircle,
  Check,
  X,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import {
  createAdministrationUserAction,
  assignExistingUserToAdministrationAction,
  toggleAdministrationUserActiveAction,
  updateAdministrationUserAction,
  type AdministrationUser
} from "@/lib/supabase/administration";

interface AdministrationUsersClientProps {
  initialUsers: AdministrationUser[];
}

export function AdministrationUsersClient({ initialUsers }: AdministrationUsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<AdministrationUser[]>(initialUsers);
  const [mode, setMode] = useState<"none" | "create" | "assign" | "edit">("none");
  const [editingUser, setEditingUser] = useState<AdministrationUser | null>(null);

  // Formulario nuevo usuario
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Formulario asignar existente
  const [existingUserId, setExistingUserId] = useState("");
  const [existingFullName, setExistingFullName] = useState("");
  const [existingEmail, setExistingEmail] = useState("");

  // Formulario edición
  const [editFullName, setEditFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetModals = () => {
    setMode("none");
    setFullName("");
    setEmail("");
    setPassword("");
    setExistingUserId("");
    setExistingFullName("");
    setExistingEmail("");
    setEditingUser(null);
    setEditFullName("");
    setError(null);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await createAdministrationUserAction({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim()
      });

      if (res.success && res.user) {
        setUsers(prev => [res.user, ...prev]);
        setSuccess(`Usuario ${res.user.full_name} creado y asignado exitosamente al rol Administración.`);
        resetModals();
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await assignExistingUserToAdministrationAction({
        userId: existingUserId.trim(),
        fullName: existingFullName.trim(),
        email: existingEmail.trim()
      });

      if (res.success && res.user) {
        setUsers(prev => [res.user, ...prev]);
        setSuccess(`Rol Administración asignado a ${res.user.full_name}.`);
        resetModals();
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al asignar la cuenta existente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: AdministrationUser) => {
    setLoading(true);
    setError(null);
    try {
      const res = await toggleAdministrationUserActiveAction(user.id);
      if (res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === user.id ? res.user : u));
        setSuccess(`Estado de ${user.full_name} actualizado.`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al modificar el estado.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError(null);
    try {
      const res = await updateAdministrationUserAction(editingUser.id, {
        fullName: editFullName.trim()
      });
      if (res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? res.user : u));
        setSuccess(`Datos de ${editFullName} actualizados.`);
        resetModals();
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error al actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Botones de acción principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Personal de Administración</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Miembros autorizados para emitir presupuestos oficiales y gestionar pedidos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            onClick={() => { resetModals(); setMode("create"); }}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Nueva Cuenta</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => { resetModals(); setMode("assign"); }}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-accent-gold" />
            <span>Asignar Cuenta Existente</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal / Form Crear Nuevo Usuario */}
      {mode === "create" && (
        <Card className="p-6 border-accent-deep/30 bg-sky-50/20 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent-deep" />
              Crear Nuevo Usuario de Administración
            </h3>
            <button onClick={resetModals} className="text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateNew} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Ej: Laura Gómez"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="laura@fivesaint.com"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Contraseña Inicial *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetModals}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading} className="bg-accent-deep hover:bg-accent-hover text-white">
                {loading ? "Creando..." : "Crear y Asignar Rol"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal / Form Asignar Cuenta Existente */}
      {mode === "assign" && (
        <Card className="p-6 border-amber-300 bg-amber-50/20 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Asignar Rol Administración a Usuario de Auth Existente
            </h3>
            <button onClick={resetModals} className="text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAssignExisting} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">User ID de Supabase Auth (UUID) *</label>
              <input
                type="text"
                value={existingUserId}
                onChange={e => setExistingUserId(e.target.value)}
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={existingFullName}
                onChange={e => setExistingFullName(e.target.value)}
                required
                placeholder="Nombre para visualización"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                value={existingEmail}
                onChange={e => setExistingEmail(e.target.value)}
                required
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetModals}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Asignando..." : "Asignar Rol"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal / Form Editar Nombre */}
      {mode === "edit" && editingUser && (
        <Card className="p-6 border-stone-300 bg-stone-50 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Edit className="w-4 h-4 text-stone-600" />
              Editar Usuario: {editingUser.email}
            </h3>
            <button onClick={resetModals} className="text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleEdit} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetModals}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading} className="bg-stone-850 hover:bg-stone-900 text-white">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabla de Usuarios Registrados */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Correo Electrónico</th>
                <th className="px-5 py-3">User ID (Auth)</th>
                <th className="px-5 py-3">Fecha Alta</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-stone-400 italic">
                    Aún no hay usuarios dados de alta en el rol Administración.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-stone-900">
                      {u.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-stone-600">
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-stone-400">
                      {u.user_id}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {new Date(u.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200"
                      }`}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(u);
                            setEditFullName(u.full_name);
                            setMode("edit");
                          }}
                          className="h-7 text-xs px-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant={u.is_active ? "outline" : "primary"}
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={loading}
                          className={`h-7 text-xs px-2.5 ${
                            u.is_active
                              ? "hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-stone-600"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          <span>{u.is_active ? "Desactivar" : "Activar"}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
