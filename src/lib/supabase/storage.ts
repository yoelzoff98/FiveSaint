export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Nota sobre permisos y Row Level Security (RLS) en Supabase Storage:
 * 
 * Este bucket ('product-images') debería configurarse en Supabase como "Público" 
 * para permitir la lectura (SELECT) desde el sitio web público.
 * 
 * Sin embargo, para subir, modificar o eliminar archivos (INSERT, UPDATE, DELETE),
 * el bucket debe contar con una Storage Policy que valide al usuario, por ejemplo:
 * 
 *    (auth.role() = 'authenticated') 
 * 
 * de esa forma, aseguramos que solo el administrador autenticado desde nuestro 
 * portal pueda ejecutar acciones de escritura.
 */
