import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase para su uso en Server Components, Server Actions o Route Handlers.
 * Inyecta las cookies de Next.js para mantener la sesión segura en el servidor.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El método setAll puede arrojar error si se llama desde un Server Component
            // que ya envió encabezados. Esto es seguro de ignorar siempre y cuando
            // exista un middleware global (updateSession) que refresque la sesión.
          }
        },
      },
    }
  )
}
