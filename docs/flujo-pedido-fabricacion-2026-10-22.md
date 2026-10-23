# Corrección del circuito de aceptación y fabricación

Rama: `codex/admin-order-flow`. Implementación y verificaciones del 22/10/2026. No se aplicaron migraciones, modificaciones comerciales ni despliegues en producción.

## Recorrido resultante

1. El vendedor confirma al cliente y envía su solicitud, conservando el circuito comercial existente.
2. ADMIN o Administración abre la solicitud desde la campana o su listado. La ficha reúne cliente, asesor, detalle comercial, producto, adicionales, configuración, cantidades y faltantes técnicos.
3. Si hay una preparación completa, **Confirmar pedido y emitir OF** acepta, identifica técnicamente, revisa y emite dentro de una sola transacción.
4. Si aún falta una receta, se puede **Aceptar y dejar en preparación**. El pedido ya aceptado ofrece **Emitir orden de fabricación**, sin volver a aceptar o convertir el presupuesto.
5. Una emisión exitosa abre directamente el documento de fabricación A4. Reimprimir utiliza la misma OF y sus snapshots. La plantilla técnica sigue sin datos económicos.

Los enlaces viejos a revisión técnica redirigen al pedido; ya no hay un circuito independiente por renglón. La pantalla de fabricación agrupa cada pedido con sus adicionales y enlaza a esa misma ficha. Los componentes duplicados de aprobación y revisión se retiraron.

## Estados y consultas

- Lista comercial, detalle y tablero comparten la presentación del estado. Un pedido aprobado sin OF aparece **Aceptado · en preparación**, aunque previamente se hubiera marcado `processing`.
- Los filtros de preparación/fabricación se resuelven antes de paginar. El JOIN con OF activas fue comprobado mediante consultas GET de solo lectura a Supabase: 5 en preparación y 0 en fabricación al momento de la comprobación.
- La consulta paginada usa el cliente de servicio para consultar metadatos técnicos. El servidor autentica al usuario y aplica su alcance expresamente: ADMIN/Administración global, vendedor por su `seller_id` de sesión, distribuidor por su `distributor_id` de sesión. Un perfil sin alcance no puede ejecutar la consulta. No se aceptan identificadores de vendedor enviados por el cliente.
- Los contadores del tablero se agregan en PostgreSQL mediante una función de lectura exclusiva de `service_role`. Se mantiene el tratamiento de producción histórica `legacy` sin reescribirla.
- El banner de solicitudes solamente aparece cuando hay solicitudes pendientes.
- La cola de fabricación excluye entregados, cancelados y ventas por distribuidor. No se corrigen contadores históricos inventando emisiones.

## Seguridad y transacciones

La migración nueva es `supabase/migrations/20261022000100_simplified_order_manufacturing_flow.sql`.

- `prepare_and_issue_order`: autenticación administrativa en servidor y control de rol activo en PostgreSQL; idempotencia, aceptación opcional, identificación explícita de producto/variante, aprobación técnica, emisión conjunta, estado y auditoría en una transacción.
- Conserva jerarquía de bloqueo: presupuesto, renglones de presupuesto, pedido y renglones del pedido. Dos usuarios distintos no pueden emitir el mismo saldo.
- Compara la preparación original y la fecha de modificación de receta para detectar cambios concurrentes. No permite cambiar un producto técnico que ya estaba identificado.
- Exige receta publicada compatible y componentes activos; bloquea recetas inexistentes o de otro producto. La identificación de renglones antiguos con producto nulo es una selección administrativa explícita en la ficha; no una inferencia por nombre.
- El servidor calcula materiales e instrucciones desde las recetas, valida opciones y capacidad A4 y no confía en materiales enviados por el navegador. Agrupa los adicionales y conserva las cantidades comerciales originales.
- Un trigger impide pasar nuevos pedidos aceptados a producción/entrega sin OF. Otro protege la emisión frente a pedidos cerrados, de distribuidor o sin identificación técnica. No altera documentos emitidos ni impide reimprimir snapshots históricos.
- `set_order_status_audited`: cambio operativo y nota de auditoría en la misma transacción, reemplazando las dos escrituras independientes anteriores.
- Las nuevas funciones de negocio no se pueden ejecutar como `PUBLIC`, `anon` o `authenticated`. Las Server Actions exigen sesión de ADMIN/Administración.
- Las operaciones de emisión y resolución revalidan las rutas afectadas. Se conserva la campana administrativa y su actualización existente.

## Datos existentes

La auditoría previa identificó cero recetas y componentes publicados, y pedidos con producto técnico sin vincular. Eso no se puede suplir con un cambio de interfaz ni con una receta ficticia.

En el pedido #32, después de instalar esta versión, se verá la aceptación existente y sus faltantes. Para emitir hay que elegir su producto/variante reales y completar la receta con materiales y cantidades reales desde **Fabricación de productos**. La ficha ofrece un enlace contextual y actualización de recetas sin descartar las elecciones en curso. No se modificó ese pedido en producción.

Los cambios técnicos se guardan en la operación de emisión; no se cambian el presupuesto fuente, sus precios, descuentos, cantidades vendidas ni importes. Los datos comerciales y contacto siguen disponibles en la ficha; no se trasladan a la OF de planta.

## Verificación realizada

| Comprobación | Resultado |
|---|---|
| `npm run test:approval` | 4 pruebas principales PASS; incluye transacción completa, rollback por receta faltante, reintentos, permisos, pedido ya aceptado, cambios de receta/presupuesto y conservación de históricos |
| `npm run test:concurrency` | PASS en dos conexiones PostgreSQL independientes; incluye dos administradores aceptando/revisando/emitiendo el mismo pedido: un pedido, una OF, sin duplicados ni deadlock |
| `npm run test:restore` | PASS con la migración nueva aplicada dos veces: 127 presupuestos y 12 pedidos, campos originales conservados |
| `npm run test:manufacturing` | 22/22 PASS |
| `npm run test:commercial` | PASS |
| `npm run test:closing` | 12/12 PASS |
| `npm run test:admin` | 15/15 PASS |
| `npm run test:accounting` | 4/4 PASS |
| `npm run test:distributor-sales` | 6/6 PASS |
| `npm run test:manufacturing-print` | PASS: V1/V2 en una A4, sin información económica |
| `npm run test:order-workflow:browser` | PASS: ficha sin receta, pedido aceptado sin nueva aprobación, emisión y navegación directa; escritorio/móvil 390 y 768 px sin desborde ni errores de ejecución |
| `npx tsc --noEmit` | PASS |
| ESLint de módulos/componentes nuevos | PASS |
| `npm run build` | PASS, incluyendo la ruta nueva de detalle de solicitud |
| Acceso sin sesión al servidor Next de producción local | PASS: solicitud, pedido y enlace antiguo de revisión redirigen al login administrativo |

Las pruebas de navegador de la ficha usan datos sintéticos y Server Actions simuladas para verificar la interacción. Las transacciones y la concurrencia se verifican por separado en PostgreSQL aislado; esto no equivale a un recorrido autenticado contra Supabase de staging. No se crearon cuentas, solicitudes ni pedidos de prueba en producción.

Los logs de build y capturas de la verificación local están fuera del repositorio: `C:/Users/yoelz/.codex/backups/fivesaint/flow-fix-2026-10-22/`.

## Orden de puesta en producción

1. Obtener un respaldo actualizado de la BD con el procedimiento habitual y comprobar qué migraciones están pendientes.
2. Aplicar la migración nueva después de las ya instaladas. Es una migración de funciones, triggers e índice; no contiene una corrección masiva de datos históricos.
3. Desplegar el código de esta rama. El código nuevo necesita las funciones de la migración: aplicar la migración antes del despliegue.
4. Comprobar con sesión administrativa que #32 abre su ficha aceptada, que los entregados no aparecen en preparación y que la campana abre la solicitud/pedido correctos.
5. Cargar y publicar las recetas reales, vincular explícitamente los pedidos que lo requieran y probar la primera emisión con datos de staging antes de operar una emisión real.

No se necesita volver a convertir pedidos aceptados ni generar presupuestos nuevos. No restaurar un respaldo completo por encima de ventas posteriores a este cambio; cualquier reversión después de operar debe preservar las nuevas OF y los movimientos comerciales. Las funciones de aceptación y emisión anteriores se conservaron como compatibilidad, con los controles nuevos de preparación.
