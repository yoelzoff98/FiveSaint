import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware Global (Next.js)
 * 
 * Responsabilidades:
 * 1. Invocar updateSession() para mantener viva la sesión de Supabase Auth
 *    de manera invisible en cada petición de página.
 */
export async function proxy(request: NextRequest) {
  // Llama a Supabase para actualizar la cookie de autenticación si está cerca de expirar.
  // También inyecta la cookie en la respuesta (Response).
  const response = await updateSession(request)

  // Opcional: Podríamos redireccionar acá mismo a los usuarios no logueados que intenten
  // entrar a /admin-FiveSaint (salvo /login). Pero para hacerlo dinámicamente y además 
  // chequear los permisos de public.admin_users (que no se puede desde middleware Edge),
  // dejaremos esa responsabilidad a requireAdmin() en el layout o pages correspondientes.
  
  return response
}

/**
 * Limitador del Middleware.
 * Evita ejecutar el middleware en archivos estáticos, rutas de API Next y recursos _next.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
