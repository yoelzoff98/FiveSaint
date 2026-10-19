# Auditoría del cierre por distribuidor — 19/10/2026

## Causas comprobadas

1. La implementación anterior de cierre (`0240c6c`) escribía por separado el estado del presupuesto, el estado del cliente y una nota automática con el importe. No verificaba el resultado de las actualizaciones de Supabase. En producción existen notas de cierre pero los presupuestos correspondientes hoy están en `draft`, con canal `direct` y sin pedido asociado. El código demuestra que podía reportar éxito aunque fallara una actualización; no se dispone de los logs históricos para identificar el error concreto de cada ejecución.
2. El listado actual buscaba presupuestos con estado `distributor_sale`. Omitía esos cierres históricos. Además, su subtotal incluía pedidos de distribuidor, pero sus filas y su contador solo incluían presupuestos. Una venta parcial registrada correctamente podía quedar fuera de la tabla o contarse por el total completo del presupuesto.
3. Dashboard y desempeño del vendedor repetían el uso de estados de presupuesto para métricas por distribuidor. Desempeño también infería el canal desde el estado actual del cliente, aunque el cliente puede tener distintas operaciones.
4. La paginación combinaba una página de servidor con otro recorte local y tenía navegación fija al portal comercial incluso desde Administración.

## Evidencia de producción, consulta de solo lectura

Hay ocho notas automáticas históricas de distribuidor. Las confirmaciones repetidas no representan ventas nuevas.

| Presupuesto | Importe registrado | Primer cierre registrado |
|---|---:|---|
| 44 | $2.031.605,55 | 24/08/2026 |
| 51 | $1.355.653,80 | 26/08/2026 |
| 54 | $989.767,35 | 28/08/2026 |
| 107 | $1.283.027,85 | 16/09/2026 |

Total verificable sin duplicados: **$5.660.054,55**. Septiembre, según el primer cierre registrado: **$1.283.027,85**.

El presupuesto 70 tiene una nota de distribuidor por $845.506,35 y un pedido directo existente (#18). No se reclasifica ni vuelve a sumar automáticamente. Hay además cuatro registros de clientes marcados como vendidos por distribuidor sin una operación monetaria inequívoca; uno corresponde a un cliente duplicado y otro tiene antecedentes directos. Estas marcas no bastan para generar importes.

## Corrección

- Una proyección compartida alimenta Ventas, dashboard y desempeño. Los pedidos actuales son la fuente principal, por su importe real y canal persistido.
- Las notas históricas solo se aceptan si cumplen el formato automático original, pertenecen al mismo cliente y presupuesto, tienen importes coherentes y no hay un pedido previo asociado. No se usan importes actuales de borradores como sustituto.
- Se conserva una operación por presupuesto histórico, usando el primer registro de cierre. Para pedidos actuales, cada cierre parcial es una operación independiente.
- Pedidos cancelados no reaparecen como ventas por el presupuesto o por una nota. Los conflictos se señalan para revisión.
- Filas, contador y subtotal usan la misma colección y filtros. Las lecturas están sujetas a la sesión y RLS; se mantiene el aislamiento por vendedor y distribuidor.
- Los presupuestos con cierres históricos quedan señalados para conciliación y se bloquean nuevas conversiones y solicitudes desde la aplicación, evitando duplicar la venta antes de revisar unidades.
- La paginación de fábrica usa su página de servidor sin segundo recorte. La pestaña distribuidor pagina su colección verificada; los enlaces conservan el portal correspondiente.

No se cambiaron datos de producción, saldos, ítems, precios ni documentos. Es una recuperación de lectura del historial existente. No requiere una nueva migración. No convierte las notas en pedidos ni presume las cantidades vendidas.

## Validación reproducible

- `npm run test:distributor-sales`: cierres actuales con todas las migraciones, reintentos, parciales, deduplicación, conflictos, cancelaciones y renderizado real de tabla/dashboard/desempeño.
- `npm run test:commercial`: regresión comercial y PDF.
- `npm run test:approval`: aprobación administrativa.
- `npm run build`: compilación de producción y TypeScript.
- `node --import tsx scripts/audit-distributor-sales.mjs`: vuelve a consultar producción sin escrituras y guarda el informe privado fuera del repositorio.

La recepción de nuevas ventas desde una sesión real de navegador queda por comprobar en el entorno de revisión. Las pruebas transaccionales se ejecutaron en PostgreSQL aislado; la consulta de recuperación sí se contrastó con Supabase real.
