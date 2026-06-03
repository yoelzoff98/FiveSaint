# Ejemplo de Inserción de Imágenes en Supabase

Dado que temporalmente no hay un panel de administración en el frontend para gestionar imágenes, se pueden asociar manualmente imágenes a los productos ejecutando este script SQL en el SQL Editor de Supabase.

## Requisitos previos:
1. Haber subido las imágenes al bucket de almacenamiento llamado `product-images` (crearlo público si no lo está).
2. Obtener la "URL pública" de cada imagen desde el panel de Storage de Supabase.

## Script de ejemplo:

```sql
-- Inserta la imagen principal (Cover) para la "Bañera Five Saint"
INSERT INTO public.product_images (
  product_id,
  url,
  alt,
  sort_order,
  is_cover
)
VALUES (
  (SELECT id FROM public.products WHERE slug = 'banera-five-saint'),
  'URL_PUBLICA_DE_SUPABASE_STORAGE_IMAGEN_1.jpg',
  'Bañera Five Saint - Vista Frontal',
  1,
  true
);

-- Inserta una segunda imagen para la galería del mismo producto
INSERT INTO public.product_images (
  product_id,
  url,
  alt,
  sort_order,
  is_cover
)
VALUES (
  (SELECT id FROM public.products WHERE slug = 'banera-five-saint'),
  'URL_PUBLICA_DE_SUPABASE_STORAGE_IMAGEN_2.jpg',
  'Bañera Five Saint - Detalle de Acabado',
  2,
  false
);
```

### Notas Importantes:
- Asegúrate de cambiar el `slug` (`'banera-five-saint'`) al slug del producto que quieras modificar.
- Reemplaza las URL largas que comiencen con algo como `https://<tu_proyecto>.supabase.co/storage/v1/object/public/product-images/...`.
- `sort_order` determina el orden de las imágenes en la galería.
- `is_cover: true` asegura que esa imagen sea la elegida para mostrarse en el catálogo principal y como fondo del Hero en la vista individual. Solo debería haber una imagen con `is_cover: true` por producto.
