# Frontend React

Cada pantalla mantiene su componente .jsx y su estilo .scss separado:
acceso, inicio, caja, inventario, ventas, clientes, reportes, configuracion
y usuarios. estructura contiene menú/cabecera, carrito la venta en curso y
dialogos los formularios y comprobantes.

main.jsx monta React. Pantalla.jsx selecciona el módulo de la ruta.
servicios/tienda.ts conserva las operaciones y el estado compartido;
servicios/estado.ts conecta ese estado con React mediante useSyncExternalStore;
servicios/api.ts realiza peticiones a Go.

Desde frontend se ejecutan npm run dev, npm run build, npm test y npm run check.
Las pruebas de renderizado están en frontend/tests/render.mjs.
Node.js pertenece únicamente a estas herramientas del frontend.
