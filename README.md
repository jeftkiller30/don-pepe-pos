# La Tiendita de Don Pepe

Sistema de ventas con backend completamente en Go, frontend React y PostgreSQL.
El backend inicia la base local, aplica las migraciones y prepara una base vacía
directamente desde Go. No utiliza Node.js, npm ni scripts JavaScript.

## Ejecutar el backend

En una terminal situada en la carpeta backend:

```powershell
go run .
```

Go está instalado localmente dentro del proyecto. Si Windows no reconoce el
comando go, utiliza este comando equivalente desde backend:

```powershell
& ..\.runtime\tools\go\bin\go.exe run .
```

La API atiende en http://127.0.0.1:3000. Conserva tus usuarios, contraseñas,
productos, ventas y fotografías. Para preparar la base y salir:

```powershell
go run . -setup
```

No se requiere ningún comando npm para preparar ni ejecutar el backend.
Al editar Go, detén el proceso con Ctrl+C y vuelve a ejecutar go run .

## Ejecutar el frontend

En otra terminal situada en frontend:

```powershell
npm run dev
```

Abre http://127.0.0.1:4200. Node.js y npm se usan únicamente como herramientas
del frontend React/Vite. El navegador se comunica con la API Go mediante /api.
Mantén abiertas ambas terminales.

## Compilar

Desde backend:

```powershell
go build -o ../.runtime/don-pepe-api.exe .
```

Desde frontend:

```powershell
npm ci
npm run build
```

INICIAR.cmd ejecuta el backend con Go. Si existe dist/react, el backend también
entrega la interfaz compilada en http://127.0.0.1:3000 sin ejecutar Node.js.
INSTALAR.cmd prepara Go/PostgreSQL y compila el frontend con sus herramientas.

## Configuración

Conserva .env y .runtime: contienen la conexión, la base local y las fotografías.
Para otro equipo instala Go y PostgreSQL y configura .env usando .env.example.
En una base vacía, Go crea el administrador y el catálogo utilizando
SEED_ADMIN_PASSWORD. Si existen usuarios, conserva sus credenciales.
APP_ENV=production activa la cookie segura; ese modo requiere HTTPS.

## Pruebas

Desde backend:

```powershell
go test ./...
$env:DONPEPE_INTEGRATION = "1"
go test -v ./...
```

La integración tiene 18 casos y usa un clúster PostgreSQL temporal independiente
en Windows. Comprueba ventas, concurrencia, stock, sesiones, permisos, clientes,
fotografías, anulaciones, reportes, migraciones y preparación de una base vacía.
No utiliza Node.js ni altera los registros de la tienda.

Desde frontend:

```powershell
npm test
npm run check
```

## Organización

- backend/main.go: arranque y servidor HTTP.
- backend/database.go: conexión, PostgreSQL local, migraciones y catálogo inicial.
- backend/auth.go: acceso, contraseñas, usuarios y permisos.
- backend/catalogo.go: productos, stock, fotografías, clientes y configuración.
- backend/ventas.go: ventas, anulaciones y estadísticas.
- backend/migrations: SQL incorporado al ejecutable con go:embed.
- backend/integration_test.go: pruebas nativas Go con PostgreSQL.
- frontend/src: componentes React organizados en carpetas en español.
- frontend/public/assets: logo y fotografías.

Los lanzadores Node del backend, sus dependencias y la versión antigua fueron
retirados de esta carpeta. Hay un respaldo recuperable fuera del proyecto activo,
en la carpeta hermana don-pepe-respaldo-node-20261027.

Consulta docs/ARQUITECTURA.md y docs/VALIDACION.md para más detalles.
