import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase para su uso en Client Components.
 * Utiliza solo la ANON_KEY y la URL pública.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
