# Composiciones importadas: visibilidad y revisión

La importación en Supabase contiene 121 componentes, 398 composiciones en borrador y 3.314 renglones. Otros 115 artículos del Excel no tienen una vinculación segura al catálogo actual y no fueron importados como composiciones. Los respaldos y el manifiesto de importación permanecen fuera del repositorio, en la carpeta de respaldos de Codex del usuario.

## Uso

1. Abrir Administración → Fabricación de productos y elegir el producto.
2. En «Composición / código de artículo», elegir el artículo original del Excel. Se muestran código, descripción y estado, incluso si no está publicado o no tiene variante asignada.
3. Revisar componentes y cantidades. Los componentes muestran su código original; los incompletos permanecen identificados e inactivos.
4. Elegir la presentación exacta y guardar para crear una receta activa específica de esa presentación. El borrador original importado se conserva.
5. Desde el pedido, «Actualizar recetas» permite seleccionar la receta habilitada y emitir la OF. También se pueden abrir las composiciones pendientes directamente desde la ficha del pedido.

Una Lady Plus de 4 jets y 2 cervicales no se debe vincular por defecto a Lady estándar de 6 jets. Si falta la presentación correcta en el catálogo, todavía hay que definirla; esta actualización no inventa equivalencias ni crea nuevas presentaciones.

## Cambios

- Selección explícita de composiciones importadas mediante el parámetro `recipe`, validado contra el producto y el acceso administrativo en el servidor.
- Los borradores se pueden consultar desde pedidos, pero quedan excluidos de las recetas aptas para emitir.
- Una composición importada sin variante no se publica directamente como receta genérica para todas las presentaciones.
- Las instrucciones editables no incluyen el hash y las notas internas de importación.
- Cálculo técnico con cuatro decimales, igual que la columna de cantidades de PostgreSQL. Se preservan fracciones como 0,33 unidades.
- Edición de códigos originales con espacios, como `OG 1055`.

No se agregaron migraciones ni se modificaron registros de producción durante este cambio de interfaz. Requiere desplegar la aplicación; no requiere volver a importar el Excel.

## Validación

- Suite de fabricación: 22 pruebas aprobadas.
- Pruebas específicas de importación y componentes de interfaz: 6 aprobadas.
- Flujo transaccional, estados y preparación: 3 aprobadas.
- Prueba de navegador con datos sintéticos: visibilidad del borrador, enlace de revisión, bloqueo de emisión pendiente, emisión con receta activa y tamaños de 390/768 px aprobados.
