# Rendimiento de navegación de portales

Rama: `codex/portal-navigation-performance`.

## Qué cambió

- Identidad y perfiles de autorización compartidos entre componentes de una misma petición mediante `React.cache`. No hay caché persistente de permisos, ni caché compartida entre usuarios. Las acciones siguen exigiendo autorización del servidor.
- Consultas de Administración, Vendedor y Distribuidor en paralelo después de comprobar el perfil ADMIN. Se conserva la prioridad de roles y el bloqueo de ADMIN inactivo.
- Los errores de consulta de permisos bloquean la operación; no habilitan una resolución alternativa con mayor acceso.
- Fabricación de productos carga variantes y recetas detalladas únicamente para el producto seleccionado. Sin selección no descarga insumos ni variantes. El listado de productos conserva un resumen mínimo de disponibilidad; los insumos del selector omiten notas y columnas de auditoría.
- La campanita actualiza su feed en tiempo real sin refrescar toda la ruta. Eventos durante una consulta en curso se consolidan en una consulta posterior, sin perder la actualización final.
- Estados de carga accesibles en Administración, Comercial y Contable. Muestran que la navegación está en curso mientras llega el contenido.

## Validación

- Build de producción aprobado.
- Suite administrativa: 15 pruebas aprobadas.
- Regresiones de solicitudes, pedidos, fabricación e integración contable: 14 pruebas aprobadas.
- Cinco pruebas nuevas sobre los módulos reales de autorización con respuestas sintéticas de Supabase: reutilización de consultas, consultas concurrentes, aislamiento entre peticiones, revocación y fallos de autorización. El entorno de prueba emula el alcance por petición documentado por React; no es una medición de red de producción.
- Navegador aislado con el componente real de notificaciones: 20 eventos generan como máximo dos consultas del feed y ninguna recarga de la página; se preserva el campo de texto sin guardar, el filtro por destinatario y el enlace a la solicitud.

Ejecutar `npm run test:performance` para reproducir la verificación específica. El navegador usa `CHROME_PATH` cuando está configurado, o la instalación de Chrome de pruebas existente en esta máquina.

## Despliegue y límites

No requiere migraciones ni cambios de datos. Requiere desplegar la aplicación. No se modificaron producción, RLS, los cálculos comerciales ni la numeración.

La campanita conserva la actualización automática; los contadores del dashboard se vuelven a consultar al navegar o recargar la página, en lugar de refrescar la ruta por cada aviso recibido.

Las mejoras reducen trabajo duplicado y cargas innecesarias. No se atribuye una reducción porcentual ni un tiempo final garantizado: falta medir navegación autenticada antes/después en el despliegue con la misma conexión y usuario. La latencia del proxy de sesión, la región del servidor y la conexión del usuario siguen influyendo.
