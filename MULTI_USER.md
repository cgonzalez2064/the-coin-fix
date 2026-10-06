> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# Estado actualizado: identidad local implementada

El login, registro local de prueba y MFA están implementados en el servidor Node/SQLite. Consulta AUTH_AND_SETUP.md para el estado actual. El registro público sigue bloqueado; OIDC, correo verificado, recuperación y sync descritos abajo son evolución propuesta. La separación IndexedDB por cuenta es organización local, no cifrado ni aislamiento contra quien controla el navegador.

# Modo público y arquitectura multiusuario

## Qué está listo hoy

El proyecto se puede servir para otras personas con `npm run build:public`. Ese build usa `src/seed-public.ts`, que no contiene salarios, deudas, nombres ni movimientos personales. Cada usuario obtiene una base IndexedDB separada por origen y perfil del navegador; una persona no ve la base local de otra. El modo invitado funciona offline y no requiere registro, servidor ni cookies.

Esto permite publicar una herramienta personal privada para varias personas, pero no es todavía una cuenta sincronizada; sí hay identidad local opcional. El dominio comparte el código de la aplicación, no los datos locales de los usuarios.

## Por qué no hay un registro falso en el frontend

Un formulario de “registro” que guarde contraseñas o tokens en React/IndexedDB no proporciona autenticación. Cualquier usuario del dispositivo podría leerlo, no existe recuperación segura y una API key quedaría expuesta. La aplicación mantiene el modo local hasta que exista un servicio de identidad real.

## Diseño recomendado para registro y sync

### Componentes

1. Frontend React/PWA sigue siendo el cliente local y la cola offline.
2. API HTTPS en un VPS o servicio gestionado separado del frontend estático.
3. Proveedor de identidad OIDC gestionado con MFA, recuperación y verificación de email, o un servicio propio revisado.
4. PostgreSQL gestionado con backups, cifrado en reposo, migraciones y un usuario de base con permisos mínimos.
5. Worker de sync que valida cada operación y aplica control de concurrencia por usuario.

### Flujo de alta

- El usuario elige “Crear cuenta”; el frontend redirige al proveedor OIDC con PKCE.
- El proveedor verifica email, límites antiabuso y opcionalmente MFA.
- La API valida el token por issuer, audience, firma y expiración; crea un `user` interno con un ID opaco.
- Toda consulta usa el `user_id` derivado del token en servidor. Nunca aceptar `user_id` enviado por el navegador.
- El perfil se crea sin datos financieros. El usuario puede importar un backup local después de confirmar el destino.
- Cerrar sesión revoca la sesión y limpia tokens en memoria; refresh tokens sólo en cookies HttpOnly, Secure y SameSite apropiado.

### Tablas mínimas

```sql
users(id uuid primary key, oidc_subject text unique not null, created_at timestamptz not null)
workspaces(id uuid primary key, owner_id uuid references users(id), created_at timestamptz not null)
workspace_members(workspace_id uuid references workspaces(id), user_id uuid references users(id), role text check (role in ('owner','editor','viewer')), primary key (workspace_id, user_id))
records(id uuid primary key, workspace_id uuid references workspaces(id), kind text not null, payload jsonb not null, revision bigint not null, deleted_at timestamptz, updated_at timestamptz not null)
sync_operations(id uuid primary key, workspace_id uuid references workspaces(id), idempotency_key text unique not null, actor_id uuid references users(id), created_at timestamptz not null)
```

En una implementación seria, separa tablas financieras (`accounts`, `transactions`, `debts`, `goals`, `events`) cuando necesites búsquedas, restricciones y reportes SQL. `payload jsonb` sirve para el primer prototipo, pero no debe sustituir índices y constraints de importes, moneda y ownership.

### Sync offline

- Cada escritura local conserva UUID, `updatedAt`, `revision` y una operación idempotente en una outbox.
- El servidor valida el schema y pertenencia al workspace; aplica la operación una sola vez.
- Si la revisión no coincide, responde `409` con el registro remoto y deja que el usuario resuelva; no sobreescribir silenciosamente movimientos financieros.
- Las eliminaciones son tombstones hasta que todos los clientes hayan confirmado la versión.
- Los backups JSON siguen disponibles aunque el servidor esté caído.

### Controles obligatorios antes de activar cuentas

- HTTPS estricto, HSTS después de verificar todo el dominio, CSP y headers de producción.
- Rate limits por IP y usuario para registro, login, importación y sync.
- Protección CSRF si se usan cookies; CORS con una allowlist exacta, nunca `*` con credenciales.
- Validación server-side, límites de payload y paginación.
- Logs sin nombres, notas, importes ni tokens; backups cifrados y restauración probada.
- MFA, verificación de email, exportación y borrado de datos, sesiones revocables y alertas de acceso.
- Pruebas de autorización entre dos usuarios/workspaces, replay de operaciones, CSRF, XSS, rate limits y migraciones.

## Compatibilidad de hosting

| Necesidad | Shared/cPanel | VPS/Node | Servicio gestionado |
|---|---:|---:|---:|
| Frontend `dist-public` | Sí | Sí | Sí |
| IndexedDB offline | Sí | Sí | Sí |
| API Node permanente | Normalmente no | Sí | Sí |
| PostgreSQL y migraciones | Normalmente no | Sí, mejor gestionado aparte | Sí |
| Workers de sync | No fiable | Sí | Sí |
| Login OIDC | Sólo frontend redirigido | Sí con API/callback | Sí |

Para la primera publicación usa el build público estático. Cuando el producto necesite cuentas, conserva el frontend y añade la API bajo `/api`; no conviertas el shared hosting en una base de datos improvisada.

## Plan de implementación

1. Modo guest actual: `build:public`, backup/import, sin telemetría.
2. Backend de identidad y workspace en staging; sin datos reales.
3. Sync de una cuenta con outbox, conflictos y auditoría.
4. Importación explícita desde backup local y recuperación de cuenta.
5. Invitaciones de workspace y roles; después, compartir hogar con permisos separados.
6. Auditoría externa, prueba de restauración y revisión de privacidad antes de producción.

No activar una etapa por copiar un `.env` al frontend. Las claves de proveedor y de base de datos pertenecen sólo al servidor.
