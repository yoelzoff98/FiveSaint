"use client";
import { useActionState } from "react";
import {
  createAccountingUser,
  toggleAccountingUser,
} from "@/lib/supabase/accounting";
export function AccountingUserForm({
  user,
}: {
  user?: { id: string; is_active: boolean };
}) {
  const [message, action, pending] = useActionState(
    async (_previous: string, form: FormData) => {
      try {
        if (user) await toggleAccountingUser(form);
        else await createAccountingUser(form);
        return user ? "Acceso actualizado" : "Cuenta creada correctamente";
      } catch {
        return "No se pudo guardar. Revisá los datos, los permisos y si el correo ya existe.";
      }
    },
    "",
  );
  return (
    <form
      action={action}
      className={user ? "space-y-2" : "border rounded-xl p-5 space-y-3"}
    >
      {user ? (
        <>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="active" value={String(!user.is_active)} />
        </>
      ) : (
        <>
          <h2 className="font-bold">Nuevo usuario contable</h2>
          <label className="block">
            Nombre
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="block border rounded p-2 w-full"
            />
          </label>
          <label className="block">
            Correo
            <input
              name="email"
              type="email"
              required
              className="block border rounded p-2 w-full"
            />
          </label>
          <label className="block">
            Contraseña inicial
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="block border rounded p-2 w-full"
            />
          </label>
        </>
      )}
      <button
        disabled={pending}
        className="bg-teal-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {pending
          ? "Guardando…"
          : user
            ? user.is_active
              ? "Desactivar"
              : "Activar"
            : "Crear acceso"}
      </button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
