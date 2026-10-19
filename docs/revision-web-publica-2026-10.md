# Correcciones de la revisión web pública Five Saint

Trabajo basado en «Revisión web Five Saint – Errores y mejoras», del 13 de octubre de 2026. Rama: `codex/public-website-review`.

## Estado de cada observación

| ID | Estado | Resolución |
| --- | --- | --- |
| A1 | Mitigado; textos pendientes | Se retiraron los tres enlaces legales inexistentes, como permite el informe. Se agregó una explicación del uso comercial de los datos en Contacto. No se inventaron términos, garantías ni una política jurídica. Publicar los textos requiere contenido oficial. |
| A2 | Corregido | El buscador superior envía a `/productos?q=...`; el catálogo busca por nombre, modelo y características, sin distinguir tildes o mayúsculas. Tiene estado sin resultados y búsqueda propia accesible. |
| A3 | Corregido con datos de la lista | Sauna permanece visible en portada, pie y filtros. Su ficha pública reutiliza los datos y las imágenes de la lista de precios existente; no se crean ni modifican registros comerciales de Supabase. |
| A4 | Corregido | Historia tiene `id=historia`. El enlace «Nuestra Planta» se reemplazó por «Cómo trabajamos», apuntando a la sección real `id=proceso`. No se inventaron fotografías de fábrica. |
| A5 | Pendiente por indicación del usuario | No se convirtieron, redimensionaron, reemplazaron ni borraron fotografías. Se conserva el estado previo de la configuración de imágenes. |
| A6 | Mitigado; horario real pendiente | Se retiró «A definir» y se unificaron portada, pie y Contacto con «Consultanos por nuestros horarios de atención». No se confirmó 9 a 18, por lo que no se publica como un dato validado. |
| M1 | Corregido | El catálogo público presenta «Design». Se conserva `/productos/spa-desing` para no romper enlaces; al no cambiar la URL no hace falta redirección. Los registros comerciales históricos no se reescriben. |
| M2 | Corregido | «distribuídos» se presenta como «distribuidos» en el catálogo público. |
| M3 | Pendiente por indicación del usuario | La fotografía de Space permanece intacta. No se determinó su fidelidad por el nombre del archivo ni se reemplazó sin una fotografía aprobada. |
| M4 | Corregido | Contacto usa las seis etiquetas de la configuración de categorías y «Asesoramiento general». Se mantienen referencias antiguas como `?ref=spas`. |
| M5 | Corregido | Ejemplos genéricos «Juan Pérez» y «nombre@ejemplo.com». |
| M6 | Pendiente de confirmación real | Se conserva `info@fivesaint.com` y se centraliza su uso en el pie. No se cambia de dominio por suposición. La recepción y ausencia de rebotes sólo pueden verificarse con un envío real autorizado. |
| M7 | Mitigado; titularidad pendiente | Se dejan de promocionar las cuentas no verificadas del pie y del menú móvil. Sus URLs se conservan en configuración, con publicación desactivada. No se afirma que sean inexistentes. |
| M8 | Corregido | La presentación pública normaliza medidas a «218 x 225 x 100 cm» y «Capacidad 6 a 7 personas». Se conservan cantidades y registros originales. |
| M9 | Corregido | «Precision Design» y «Premium Wellness Craft» se reemplazan por textos en español. |
| M10 | Corregido | El tercer bloque de portada usa «A medida», con la misma jerarquía visual, sin inventar una cifra de productos. |
| M11 | Corregido | Se suavizan las afirmaciones de liderazgo sin respaldo de la configuración institucional, portada y beneficios. |
| M12 | Corregido | Ducha Escocesa funciona como las demás categorías: permanece en el listado filtrado y permite abrir la ficha de producto. |
| B1 | Corregido | El catálogo recibe búsqueda y categoría desde el servidor. Los productos aparecen en el HTML inicial; se retira la dependencia de `useSearchParams` y del fallback de hidratación. Las lecturas públicas anónimas usan caché de una hora. |
| B2 | Corregido en código; alta externa pendiente | Se generan `/robots.txt` y `/sitemap.xml` con rutas públicas y fichas activas. Se excluyen portales, API y presupuestos por enlace de los rastreadores y del sitemap. El alta en Search Console requiere la cuenta y verificación del titular. Robots no reemplaza los permisos de acceso. |
| B3 | Corregido | Metadatos Open Graph y Twitter públicos, base de URLs centralizada y tarjeta de marca generada por código. No se modifican fotografías. |
| B4 | Corregido | Título de portada: «Five Saint — Hidromasajes, spas y bañeras de fabricación nacional». |
| B5 | Corregido | Textos alternativos descriptivos cuando el catálogo contenía nombres de archivo. Sólo cambia texto de presentación, no archivos ni URLs de fotos. |
| B6 | Corregido | Encabezado y menú móvil usan el SVG de marca que ya utilizaba el pie (16 KB). No se crea ni modifica ningún archivo de imagen ni fotografía. |
| B7 | Pendiente por indicación del usuario | No se generan versiones artificialmente ampliadas de las columnas; se requieren originales con más resolución. |
| B8 | Corregido | Objetivos táctiles mínimos de 44 px en la web pública móvil. Las reglas están acotadas a `.public-site` y no cambian los portales operativos. |

## Pruebas y alcance

- `npm run test:public`: búsqueda con tildes, intersección de filtros, estado vacío, normalización, texto alternativo, HTML inicial y validación del formulario.
- `node scripts/verify-public-website.mjs`: prueba local en navegador de búsqueda, categorías, fichas, anclas, formulario y navegación móvil. Intercepta las solicitudes POST; el éxito del formulario es simulado y no verifica entrega de correos ni escribe clientes reales.
- `npm run build`: compilación de producción.
- Comprobación de ESLint sobre los archivos TypeScript modificados.

La comprobación en navegador debe ejecutarse con un servidor local iniciado; el script rechaza destinos remotos. Opcionalmente acepta `PUBLIC_REVIEW_BASE_URL`, `PUBLIC_REVIEW_CHROME` y `PUBLIC_REVIEW_OUTPUT_DIR`.

No hay migraciones ni escrituras en Supabase. Las correcciones de catálogo se hacen al presentar la web pública; no alteran datos históricos, precios, variantes, presupuestos, pedidos, facturación o documentos emitidos. No se hace despliegue ni alta en servicios externos.

## Datos para completar después

Fotografías de productos: pendientes por instrucción explícita del usuario. También quedan pendientes el horario real, recepción del correo, cuentas sociales oficiales, textos legales oficiales y verificación de Search Console. No se deben marcar como confirmados por haber pasado pruebas de interfaz.

## Resultados finales

- Pruebas públicas: **4/4 PASS**, incluyendo protección para no convertir potencias eléctricas o cantidades de equipos en medidas.
- Regresión comercial: **39/39 PASS**, incluidos PDF, tasas e importes históricos.
- Compilación final de producción: **PASS**.
- ESLint: sin errores; dos advertencias preexistentes en el carrusel (dependencia de efecto y variable de iteración sin uso).
- Navegador local con datos públicos reales: búsqueda superior y por catálogo, HTML inicial, filtros, Design con URL anterior vigente, anclas y formulario con envío interceptado: **PASS**.
- Navegación móvil: cuatro destinos del menú, ausencia de desborde a 390/768 px y botón de categoría sin depender de hover: **PASS**.
- SEO: `/og`, `/robots.txt`, `/sitemap.xml` y etiquetas Open Graph/Twitter: **PASS**. No se incluyen rutas operativas o presupuestos privados en el sitemap.
- WhatsApp: enlace al número configurado **verificado sin enviar mensajes**. La apertura de la aplicación móvil y la entrega de correos siguen requiriendo comprobación real.
- Fotografías y migraciones: **ningún archivo modificado**. Sin despliegue ni escrituras en producción.

## Sauna desde la lista de precios

Se reutiliza `saunaData`, la misma fuente de la sección Sauna de `PriceListPdf.tsx`, sin modificarla. Incluye capacidades de 3 a 4, 5 a 6 y 6 a 7 personas; consumos de 4,5, 6 y 7,5 kw tal como figuran en la lista; líneas monofásica y trifásica publicadas; seis códigos de cabina y revestimiento (`FSSAU1C/R`, `FSSAU2C/R`, `FSSAU3C/R`); opcionales `FSSAUV` y `FSSAUB`; cinco fotos y tres esquemas originales.

La ruta `/productos/sauna` presenta todos estos datos, la fabricación a medida, la advertencia sobre esquemas de ejemplo y el contacto para cotizar de la lista. No se publican precios numéricos porque la fuente no los contiene. El catálogo, la búsqueda y el sitemap incorporan esta ficha. La portada usa una fotografía de Sauna ya incluida en la lista, en lugar de la portada ilustrativa anterior.

Se usa una entrada explícita del catálogo público basada en la lista existente, con identificadores `price-list:`. No son IDs de Supabase ni se usan para presupuestar, facturar o fabricar. Si ya existe un producto con slug `sauna`, no se duplica ni modifica su registro al construir el listado. No se modifica la lista de precios original, los archivos de imagen, las fotos de otras categorías ni los datos comerciales. No requiere migraciones o cargas en producción.

Validación: `npm run test:public`, **7/7 PASS**; ESLint de los archivos de Sauna, **sin errores**; prueba en navegador de ficha, códigos, ocho imágenes HTTP 200, entrada del catálogo, ancho móvil de 390 px, enlace al formulario con categoría Sauna y sitemap, **PASS**. No se enviaron consultas ni se crearon clientes de prueba.

Cierre de Sauna: compilación de producción **PASS**. La ficha estática `/productos/sauna` se comprobó también con `next start` en un servidor local de producción: imágenes cargadas y sin errores de ejecución o hidratación en consola. Se cerró ese servidor de verificación al terminar; el servidor de desarrollo del usuario se conserva.
