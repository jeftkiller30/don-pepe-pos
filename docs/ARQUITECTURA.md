# Arquitectura

React → API HTTP Go → PostgreSQL.

El backend es un monolito organizado por funciones del negocio. net/http atiende
las peticiones y database/sql ejecuta consultas parametrizadas a PostgreSQL.
No hay procesos, paquetes npm ni scripts Node.js en el backend.

main.go carga .env, reserva el puerto y prepara la base antes de iniciar HTTP.
database.go inicia el PostgreSQL local cuando corresponde, ejecuta las migraciones
SQL incorporadas con go:embed y prepara el catálogo si no existen usuarios.
process_windows.go evita ventanas auxiliares de los procesos de PostgreSQL.

El historial _donpepe_go_migrations y sus checksums se conservan. La lectura del
historial _prisma_migrations permite reconocer instalaciones anteriores; no
requiere instalar ni ejecutar Prisma.

auth.go administra sesiones JWT mediante cookies HttpOnly/SameSite Strict,
contraseñas bcrypt y comprobaciones de rol/estado en PostgreSQL. catalogo.go
gestiona inventario, movimientos, fotografías, clientes y ajustes.

ventas.go confirma la venta, sus líneas y los movimientos de stock dentro de una
transacción. Los bloqueos de filas evitan sobreventa; el UUID de solicitud evita
duplicados al reintentar. Una anulación repone existencias una sola vez.
Los reportes convierten los días peruanos a límites UTC.

El frontend sigue siendo React. Node.js y npm se usan en frontend para Vite,
compilación y pruebas de componentes. No atienden las peticiones del backend.
En desarrollo, Vite usa 4200 y reenvía /api a Go en 3000. La versión compilada
puede servirse desde Go sin tener un proceso Node.js en ejecución.
