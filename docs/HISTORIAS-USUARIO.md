# Historias de usuario — Don Pepe

## Objetivo

Permitir que una tienda de productos económicos registre ventas, controle existencias y consulte su actividad desde una interfaz sencilla. Alcance: una tienda, moneda soles, administración/caja/inventario.

| ID | Historia | Prioridad | Criterios de aceptación |
|---|---|---|---|
| HU-01 | Como trabajador quiero iniciar sesión para acceder según mis funciones. | Alta | Credenciales válidas dan acceso; las inválidas se rechazan; cada endpoint aplica el rol. |
| HU-02 | Como administrador quiero crear usuarios para organizar mi equipo. | Alta | Puedo elegir rol y activar/desactivar cuentas; no puedo desactivar mi propia cuenta. |
| HU-03 | Como encargado quiero registrar y editar productos. | Alta | Código único, nombre, categoría, precio positivo, mínimo e ilustración; errores visibles. |
| HU-04 | Como encargado quiero reponer o retirar unidades con un motivo. | Alta | Se registra cantidad, motivo, responsable y fecha; una retirada no deja stock negativo. |
| HU-05 | Como encargado quiero ver productos con stock bajo. | Alta | Se muestran existencias menores o iguales al mínimo; la alerta permite acceder al ajuste. |
| HU-06 | Como cajero quiero buscar y escanear códigos para atender rápido. | Alta | Búsqueda por nombre/código, categorías y lector USB tipo teclado; código exacto más Enter agrega una unidad. |
| HU-07 | Como cajero quiero modificar el carrito antes de cobrar. | Alta | Puedo añadir, disminuir, quitar o vaciar; las cantidades respetan el stock disponible. |
| HU-08 | Como cajero quiero registrar efectivo y vuelto. | Alta | El efectivo debe cubrir el total; el vuelto es exacto; el cobro guarda venta y descuenta stock juntos. |
| HU-09 | Como cajero quiero registrar Yape/Plin o tarjeta. | Alta | Selecciono el medio, verifico el pago fuera del sistema y confirmo; se registra el medio sin procesar cargos. |
| HU-10 | Como administrador quiero aplicar descuentos. | Media | Solo administrador; importe en soles; el total final debe ser positivo. |
| HU-11 | Como cajero quiero asociar un cliente a una venta. | Media | Puedo elegir cliente registrado o público general; crear cliente desde caja. |
| HU-12 | Como cajero quiero entregar un ticket. | Alta | Al confirmar veo detalle, fecha, cajero, importes y vuelto; puedo imprimir o guardar PDF. |
| HU-13 | Como administrador quiero anular una venta errónea. | Alta | Motivo obligatorio; la venta permanece anulada y repone stock exactamente una vez. |
| HU-14 | Como administrador quiero consultar las ventas por fecha. | Alta | Rango válido, búsqueda por ticket/cliente/pago, detalle y CSV; máximo un año por consulta. |
| HU-15 | Como administrador quiero un dashboard actualizado. | Media | Muestra ventas completadas, tickets, unidades, clientes identificados, gráfico y favoritos. |
| HU-16 | Como administrador quiero reportes por período y medio de pago. | Media | Reporta importes netos y favoritos brutos; excluye anulaciones; CSV e impresión. |
| HU-17 | Como cajero quiero mantener datos de clientes. | Media | Alta/edición, documento único opcional, búsqueda; archivo reservado a administrador. |
| HU-18 | Como encargado quiero consultar movimientos de inventario. | Media | Cada reposición, retiro, venta y anulación deja cantidad, fecha, motivo y responsable. |
| HU-19 | Como administrador quiero personalizar el ticket. | Baja | Cambiar nombre, dirección, teléfono y mensaje se refleja en la siguiente impresión. |
| HU-20 | Como trabajador quiero cambiar mi contraseña y cerrar sesión. | Alta | Se exige contraseña actual y mínimo de diez caracteres para la nueva; salir elimina la cookie del navegador. |

## Flujo principal

Iniciar sesión → Caja → buscar productos → ajustar cantidades → elegir cliente → cobrar → seleccionar medio de pago → confirmar → guardar transacción y movimientos → emitir ticket → actualizar reportes.

## Prototipo

Referencia aprobada en `frontend/public/assets/prototipo-referencia.png`. Interfaz implementada en Angular: menú lateral azul, logo, barra superior, tarjetas, gráfico, alertas y caja lateral. Pantallas adaptadas para escritorio, tablet y móvil mediante puntos de corte en CSS. La coincidencia visual y las interacciones en distintos tamaños requieren la revisión de navegador indicada en VALIDACION.md.
