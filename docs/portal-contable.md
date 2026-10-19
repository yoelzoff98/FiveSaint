# Portal Contable — primera entrega

## Alcance implementado
- `/contable/login`: acceso separado con la autenticación Supabase existente.
- `/contable`: consulta mensual de todos los comprobantes del registro fiscal, 25 por página.
- `/contable/exportar`: CSV del período, con controles de permisos y protección frente a fórmulas. Límite explícito de 1000 registros; rechaza exportaciones mayores sin truncarlas.
- `/contable/usuarios`: ADMIN crea cuentas contables y activa/desactiva sus accesos. Administración puede consultar el portal pero no administrar credenciales.
- Acceso desde la navegación de Administración.

El rol contable es de lectura. Puede consultar los presupuestos y pedidos vinculados a cada comprobante mediante copias históricas completas de sus cabeceras e ítems. No incorpora acceso general a las tablas comerciales ni permite modificar sus documentos. ADMIN y Administración conservan sus accesos existentes.

## Datos y fiscalidad
La migración `20261019000100_accounting_portal.sql` agrega `accounting_users` y `fiscal_documents`, sus permisos RLS y un índice por fecha. No modifica registros comerciales ni convierte pedidos en facturas. Cada comprobante fiscal autorizado aparece automáticamente; no existe selección manual para ocultarlo.

El registro fiscal es inmutable, incluso frente a actualizaciones ordinarias con service_role. Notas de crédito/débito pueden asociarse al original mediante original_document_id. La combinación CUIT emisor, tipo, punto de venta y número evita duplicados.

**No incluye emisión ARCA, importación del sistema anterior, PDFs, libro IVA ni liquidación impositiva.** La presencia de campos de autorización es una validación estructural, no una verificación contra ARCA. Ninguna pantalla permite cargar una autorización arbitraria. El futuro conector de servidor deberá registrar únicamente respuestas fiscales verificadas y manejar recuperación e idempotencia. El portal permanece vacío hasta implementar ese ingreso de comprobantes reales. No es aún un sistema contable completo.

## Puesta en marcha
1. Revisar y aplicar únicamente las migraciones pendientes correspondientes al despliegue; esta entrega no ejecuta db push ni cambia producción.
2. Desplegar el código junto con la migración del portal.
3. Como ADMIN, acceder a Administración → Portal Contable → Accesos contables y crear una cuenta con correo real.
4. Verificar acceso del contador y denegación de rutas comerciales con esa cuenta. No generar comprobantes fiscales de prueba en producción.

## Validación local
`npm run test:accounting`: período, exportación segura, migración acumulada, matriz ADMIN/Administración/Contador/Vendedor, inactividad, anon, autoasignación bloqueada, inmutabilidad e idempotencia.
`npm run test:restore`: migración nueva aplicada dos veces a la restauración local, conservando todos los campos comerciales originales.
`npm run build`: compilación de producción.

Toda prueba de documentos usa datos sintéticos en una base aislada. No se crearon usuarios ni comprobantes en producción.

## Trazabilidad del circuito (ampliación)
La migración adicional `20261019000200_accounting_document_traceability.sql` agrega vínculos explícitos de origen, índices y snapshots automáticos. Al registrar un comprobante, el conector debe indicar `source_order_id` (y se obtiene su presupuesto automáticamente) o `source_budget_id` cuando no hay pedido. Si existe un pedido, el presupuesto debe corresponder a ese pedido. No se infieren vínculos por nombre ni importe. Las notas asociadas heredan los documentos del original. Se valida emisor y moneda del comprobante asociado.

`/contable/comprobantes/[id]` muestra el comprobante, el presupuesto, el pedido y los demás comprobantes de esa operación, incluso de otros meses. El listado mensual ofrece accesos directos a cada sección. Las copias muestran todos los productos y adicionales, cantidades, precios, descuentos, impuestos y observaciones disponibles, sin recortar el origen a la parte facturada. Las copias permanecen inalteradas ante posteriores cambios comerciales. Los tokens públicos y claves de idempotencia no se exponen.

La facturación parcial muestra total neto de notas y pendiente de facturar calculado con aritmética decimal en PostgreSQL, separado del saldo de cobranza. Se calcula únicamente entre documentos en la misma moneda y tipos reconocidos. Las listas se paginan y los totales se agregan en la base de datos.

No se inventan asociaciones para comprobantes existentes sin origen. No se modifican sus datos inmutables ni se reconstruye falsamente su estado histórico. Esos casos muestran un aviso. El conector ARCA, la importación histórica, los cobros, los remitos y los PDFs siguen pendientes; esta ampliación no simula sus registros.

## Navegación y diseño del portal
El portal comparte una estructura visual equivalente a Administración: sidebar oscura, encabezado fijo, identificación de perfil y contenido en tarjetas. La navegación se mantiene en listados, detalle y gestión de usuarios. El login queda independiente.

Rutas disponibles: `/contable` (resumen), `/contable/presupuestos`, `/contable/pedidos`, `/contable/comprobantes`, `/contable/notas`, `/contable/exportaciones` y `/contable/usuarios` (sólo ADMIN). Las secciones de presupuestos y pedidos muestran sus vínculos por comprobante, con accesos al origen íntegro; una operación con varias facturas puede aparecer en varias filas. Los filtros se ejecutan en Supabase y la paginación se mantiene en 25 registros. Sólo se proyectan los números de los documentos desde JSON, sin cargar todos sus ítems en los listados.

En celular se usa un menú modal con foco, cierre con Escape y enlaces funcionales. Los contadores no ven accesos internos ni gestión de usuarios. Esta ampliación de interfaz no agrega migraciones ni modifica datos.

Validación: TypeScript, ESLint, compilación de producción y suite contable aprobados; prueba visual aislada con los componentes reales (contexto sintético, sin conexión a BD) a 1440px y 390px, navegación de escritorio, menú móvil, Escape, enlace activo, ausencia de desborde y enlaces internos según perfil. Se verificó además con una consulta de sólo lectura que Supabase admite la proyección de números desde los snapshots.
