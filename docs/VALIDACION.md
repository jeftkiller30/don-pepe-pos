# Validación del backend completamente Go

Se trasladaron a Go el arranque de PostgreSQL, las migraciones, la preparación
inicial del catálogo y las pruebas de integración.

Las pruebas nativas Go cubren 18 casos con PostgreSQL real y un clúster temporal
exclusivo, además de la prueba unitaria sobre los límites UTC del día peruano.
Se comprueban autenticación, origen, permisos, fotografías, clientes, precio fijo,
stock, pagos inválidos, idempotencia, concurrencia, anulaciones, reportes,
archivo con historial, usuarios, configuración, contraseña, sesión, adopción de
migraciones antiguas, preparación inicial y entrega de React compilado.

Los registros de la tienda no se usan como datos de prueba. La preparación de
una instalación existente conserva sus usuarios y contraseñas.

También pasó la comprobación opcional sobre la instalación existente: acceso,
siete consultas de la API y comparación completa de las siete tablas de negocio
antes y después. Los registros y hashes de contraseña coincidieron.

El frontend conserva sus pruebas de componentes y su compilación Vite.
La revisión visual final y el diálogo real de impresión deben comprobarse en el
navegador del equipo; el navegador integrado de este entorno devolvió timeout.

El proyecto activo no contiene los lanzadores Node.js del backend ni su antiguo
package.json. El respaldo retirado está en la carpeta hermana
don-pepe-respaldo-node-20261027 y se puede recuperar.
