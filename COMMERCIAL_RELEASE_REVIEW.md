# Cierre de correcciones comerciales — 3 de octubre de 2026

Correcciones implementadas y verificadas localmente. No se desplegó la aplicación
ni se ejecutó ninguna migración, restauración o escritura contra producción.
Este informe cubre la estabilización comercial; el portal contable y la emisión
fiscal de facturas siguen siendo un módulo posterior.

## Cambios realizados

- La creación y conversión reutilizan la clave de idempotencia al reintentar el
  mismo contenido. SQL espera la operación concurrente y rechaza claves reutilizadas
  con contenido distinto.
- Conversión y cancelación bloquean los registros en el mismo orden. Los cambios
  de estado rechazan actualizaciones sobre un estado que cambió mientras se editaba.
- Se corrigieron las comprobaciones de propiedad con valores nulos. Todas las
  versiones de las RPC comerciales quedan restringidas a `service_role`; el
  servidor deriva la identidad de la sesión autenticada.
- La creación envía explícitamente `p_tax_rate` para evitar ambigüedad con la
  firma de creación que dejó la V2.
- El esquema suministrado conserva `budgets.discounts` como `numeric[]`. La RPC
  acepta JSON y lo convierte al tipo de la columna, sin modificar los históricos.
- Se ampliaron las restricciones de estados para conversiones parciales y ventas
  de distribuidor. El estado inicial de clientes pasa a `nuevo`, válido según su CHECK.
- Los pedidos parciales distribuyen el neto emitido en centavos, conservando su
  suma exacta incluso con descuentos en cascada y cantidades parciales.
- La pantalla y el componente PDF usan importes emitidos y snapshots. Admiten IVA
  cero u otras tasas; los PDFs nuevos no incluyen notas internas.
- Compartir utiliza el token devuelto al publicar. Solo los tokens publicados
  habilitan la consulta pública. Los borradores, revocados e IDs internos no
  exponen el documento; no se necesitaron enlaces históricos porque no existían.
- Las métricas no vuelven a sumar pedidos de distribuidor cancelados o vinculados
  fuera del período como supuestas ventas históricas sin pedido.
- El contador público valida el enlace y realiza una actualización condicional
  atómica. No escribe al refrescar dentro de la ventana de 60 segundos. La carga
  pública se deduplica por petición entre metadatos y página con `React.cache`.
- Next.js y su configuración ESLint se actualizaron a 16.3.8. Se aplicaron las
  correcciones compatibles de dependencias, sin forzar cambios de versión mayor.

## Migración vigente

Aplicar exclusivamente `supabase/migrations/20261003000100_commercial_release.sql`.
Tiene una versión nueva, se ejecuta en una transacción y no elimina documentos,
columnas ni tablas. Los rollbacks y versiones anteriores se movieron a
`supabase/archive`, fuera del directorio de ejecución automática.

## Evidencia ejecutada

- `npm run build`: aprobado, incluyendo TypeScript.
- Suite completa de cinco archivos de pruebas: **64 aprobadas, cero fallos**.
  Incluye pruebas unitarias, simuladores anteriores y 14 pruebas sobre PostgreSQL
  embebido PGlite; los simuladores no se presentan como evidencia de concurrencia.
- `npm run test:concurrency`: aprobado con PostgreSQL local y sesiones de backend
  independientes. Usa una reconstrucción del esquema suministrado, con sus arrays,
  CHECK, UNIQUE y claves foráneas; los IDs de `auth.users` se simulan localmente.
  Prueba actualización desde V2, restricciones de todas las firmas RPC, conflicto
  sin commit, resultados idempotentes, saldos competidores, cancelación/conversión,
  descuentos, sumas exactas de pedidos parciales, venta y cancelación por distribuidor,
  publicación, revocación y visualizaciones concurrentes.
- `npm run test:restore`: aprobado. Restaura las **12 tablas incluidas en el respaldo
  local**, aplica la migración dos veces y compara **todos los campos originales**.
  Conservó 127 presupuestos y 12 pedidos; los nuevos números fueron 143 y 25.
  No equivale a un respaldo completo de Auth, Storage ni de tablas ausentes del archivo.
- El componente real del PDF se renderizó para todos los presupuestos del respaldo;
  los netos guardados y los totales mostrados se conservaron. Esto verifica contenido,
  no constituye una comparación visual de todos los PDFs impresos.
- Navegador sobre la compilación local: login visible, ruta comercial redirigida
  al login sin sesión y enlace inválido sin exposición de documentos; sin errores
  de navegador detectados en esas comprobaciones.
- `npm audit --omit=dev`: **cero vulnerabilidades reportadas**.
- `git diff --check`: aprobado.

Los logs y la evidencia que usa el respaldo quedan en `backups/`, ignorado por Git.

## Límites y deuda que sigue visible

El lint general sigue fallando: **79 errores y 138 advertencias**, principalmente
`any` y efectos React heredados. No se desactivaron reglas para ocultarlo. El lint
dirigido de PDF, cálculos, vista pública y nuevas pruebas pasó con advertencias de
imágenes. El audit completo conserva cinco avisos altos en dependencias de desarrollo
de ESLint; la solución automática propuesta implicaba una versión incompatible.

El esquema suministrado no incluye definiciones de políticas RLS, triggers, vistas,
funciones externas ni permisos reales de Supabase. Las pruebas locales no certifican
esos elementos ni un recorrido autenticado completo contra un staging de Supabase.
Tampoco se midió el consumo de producción ni se garantiza un costo mensual específico.

## Puesta en producción

Antes del despliegue, tomar un respaldo **actual**: el archivo local del 2 de octubre
no debe restaurarse sobre la base activa, porque hay vendedores generando documentos.
Verificar la migración y el flujo autenticado en una copia con las políticas y triggers
reales. Aplicar la migración vigente y después desplegar esta aplicación; comprobar
creación, reintento, conversión parcial, cancelación, PDF y publicar/revocar enlace.
Si se revierte la aplicación, conservar los datos y columnas incorporados; no ejecutar
los rollbacks archivados ni sobrescribir la base con el respaldo antiguo.
