> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# The Coin Fix: acceso, MFA y puesta en marcha

## Estado de esta entrega

Hay login y registro local reales, con un servicio Node separado. Las credenciales se verifican en servidor; no se almacenan contraseñas ni tokens en React, localStorage o IndexedDB. Los movimientos financieros siguen en el dispositivo. El acceso NO cifra esa base, no proporciona sincronización y no impide que quien controle el perfil del navegador lea sus archivos. El modo local sin cuenta continúa disponible.

La interfaz del hogar empieza con un responsable genérico. Puedes agregar personas, su rol y un aporte previsto. Un aporte positivo crea una fuente recurrente de ingresos, inicialmente sin fecha: abre Ingresos para calendarizarla. No se inventan cobros recibidos. Los gastos asignados indican su destinatario, no necesariamente quién los pagó. El aporte de una mascota debe ser cero. Los nombres existentes en movimientos importados se preservan.

## Compatibilidad e instalación

- Node **24.12.x–24.x**, npm y un navegador moderno con IndexedDB/Web Crypto. Node 22 no es el runtime recomendado para este servidor. `node:sqlite` todavía emite advertencia experimental en 24.12; probar migraciones al actualizar Node.
- React/TypeScript/Vite/Tailwind/Dexie permanecen en el frontend. No hay dependencia de un servicio de IA.
- SQLite es la base de identidad; viene con Node, sin instalación de un servidor SQL. PostgreSQL no se necesita para este modo local. Una futura API financiera requerirá un modelo propio con autorización por propietario.

```bash
npm ci
# Terminal 1: servicio de identidad (puerto 3001, sólo loopback)
npm run auth
# Terminal 2: interfaz (puerto fijo 5175)
npm run dev
```

Abre http://127.0.0.1:5175/. El proxy de Vite envía `/api/auth` al puerto 3001. Usa siempre el mismo origen para conservar tu IndexedDB. Cambiar puerto, dominio o perfil crea otra base del navegador.

## Crear la cuenta local de prueba

En la máquina de esta entrega ya se creó la cuenta solicitada; usa las credenciales entregadas en la conversación. El ZIP deliberadamente NO contiene la base de identidad, claves ni credenciales. Para recrearla en otra máquina, ingresa los valores en tu terminal sin guardarlos en archivos públicos:

```bash
read 'DEMO_EMAIL?Correo de prueba: '
read -s 'DEMO_PASSWORD?Contraseña de prueba: '
export DEMO_EMAIL DEMO_PASSWORD
npm run auth:seed
unset DEMO_EMAIL DEMO_PASSWORD
```

Estos comandos de lectura son para zsh (macOS). En otros sistemas configura las variables de entorno con la herramienta de tu shell. El script crea una cuenta responsable sólo si el correo no existe; no reemplaza contraseñas existentes. Un bootstrap de producción exige al menos 15 caracteres. No copies la base de prueba a producción.

## MFA

1. Entra con tu cuenta y abre **Ajustes → Acceso y seguridad**.
2. Introduce tu contraseña actual y elige **Configurar MFA**.
3. Agrega la clave manual en una aplicación autenticadora como cuenta TOTP: SHA-1, 6 dígitos, periodo de 30 segundos.
4. Introduce un código válido para **Activar MFA**. La configuración pendiente expira en 10 minutos.
5. Guarda los 8 códigos de recuperación fuera del navegador. Se muestran una sola vez y cada uno se consume al usarse.
6. Al iniciar sesión, introduce email y contraseña. Completa la verificación anti-bot posterior; si la cuenta tiene MFA activo, aparece una pantalla para el código de autenticador o recuperación. El código usado al activar MFA no puede reutilizarse: espera el siguiente código o usa recuperación.

No se activa sin demostrar posesión del segundo factor. Habilitarlo revoca otras sesiones. Los códigos TOTP ya aceptados no pueden repetirse. Esta versión no permite desactivar MFA desde la UI; conserva los códigos. No hay envío de correo, recuperación automática de cuenta ni cambio de contraseña en la UI todavía.

## Controles implementados

- Password hashing scrypt con salt aleatorio: N=32768, r=8, p=3, salida 64 bytes. Comparación con `timingSafeEqual`; hash ficticio para cuentas desconocidas.
- Consultas SQL preparadas con parámetros, Zod estricto, tamaño máximo 8 KiB, límites de longitud y mensajes de credenciales genéricos. No se ejecuta HTML/SQL suministrado por usuarios.
- Cookie HttpOnly, SameSite=Strict, Path=/api/auth. Secure obligatorio en producción; excepción sólo para HTTP local. Sesiones de 8 horas con token aleatorio; se almacena sólo su SHA-256. Logout las invalida en servidor.
- Comprobación exacta de Origin y token CSRF en acciones autenticadas. Sin CORS abierto ni tokens persistidos en el frontend.
- Throttling persistido: 10 intentos por correo/15 min, 15 por IP/15 min, 180 solicitudes por IP/15 min, 10 acciones MFA por cuenta/15 min. También cuentan intentos válidos; no insistir repetidamente durante pruebas.
- La IP viene del socket, nunca de headers arbitrarios. Detrás de nginx todos los usuarios comparten el límite de la IP del proxy: adecuado para revisión privada; para escala pública hace falta un proxy confiable explícito y límites de borde adicionales.
- TOTP cifrado con AES-256-GCM y clave fuera del código. Códigos de recuperación almacenados como hashes. Rechazo de replay y expiración de configuraciones pendientes.
- Respuestas de identidad `no-store`; Workbox no cachea la API.

## CAPTCHA local y producción

En local hay un desafío aritmético accesible, de un uso y 5 minutos de validez, validado en servidor. No resiste bots avanzados y no se presenta como CAPTCHA de producción. En producción se renderiza **Cloudflare Turnstile** y el servidor valida el token con Siteverify, su hostname y expiración propia del proveedor. No enviamos movimientos ni notas a Cloudflare; el widget sí implica procesamiento de señales del navegador por el proveedor.

Variables del servidor, nunca prefijadas VITE_:

| Variable | Valor / uso |
|---|---|
| `APP_ORIGIN` | Origen exacto, sin `/` final; local `http://127.0.0.1:5175` |
| `AUTH_PORT` | `3001` por defecto |
| `AUTH_DATA_DIR` | Ruta persistente privada; por defecto `server/data` |
| `NODE_ENV` | `production` para HTTPS, cookie Secure y CAPTCHA real |
| `TURNSTILE_SITE_KEY` | Clave pública del widget, registrada para el dominio |
| `TURNSTILE_SECRET_KEY` | Secreto exclusivo del servidor |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | Sólo bootstrap manual; eliminar del entorno al terminar |

El servidor se niega a arrancar en producción sin HTTPS y claves CAPTCHA. **El registro público en producción está bloqueado**, hasta integrar verificación de correo y recuperación con un proveedor de identidad revisado. El registro local sirve para pruebas y separa perfiles vacíos. No hay una falsa promesa de plataforma SaaS lista para altas públicas.

## Almacenamiento y backups

`server/data/auth.sqlite` guarda identidad, sesiones, límites, desafíos y códigos hashed. `mfa.key` descifra los secretos MFA: respaldar ambos juntos en almacenamiento cifrado y privado. El directorio usa permisos 0700, archivos sensibles 0600. No incluirlo en ZIP, Git, dist ni public_html. Para copia consistente, detener el servicio y copiar el directorio completo, incluidos WAL/SHM si existen; después reiniciar. Perder la clave hace inutilizables los TOTP cifrados. No usar copias en caliente de un único archivo SQLite.

El propietario local usa `finanzas-private-v1` para conservar la base anterior del mismo origen. Otras cuentas usan `coin-user-<UUID>` y el invitado `coin-user-guest`, con datos iniciales neutrales. Eso separa vistas, NO cifra ni crea una frontera de seguridad contra el propietario del dispositivo. Un backup financiero se exporta por separado desde cada perfil. Las cuentas no tienen acceso a datos de otros usuarios a través de esta API porque la API no guarda finanzas.

## Pruebas, build y hosting

```bash
npm run check       # lint + cálculos/IndexedDB + servidor de identidad + build
npm run test:auth   # requiere poder abrir un puerto local temporal
npm run build:public
APP_ORIGIN=http://127.0.0.1:4173 npm run auth
# En otra terminal:
npm run preview
```

Para preview detén primero el auth local de 3001 si sigue activo. El origen del servicio debe coincidir con el de la interfaz; no aceptamos orígenes alternativos automáticamente.

Shared/cPanel sirve `dist-public` en modo local; por sí solo no ejecuta este login. Para acceso con cuentas necesitas VPS o servicio Node detrás del mismo dominio/proxy, con HTTPS, SQLite persistente fuera del document root y las variables anteriores. Sigue DEPLOY_NAMECHEAP.md y docs/nginx.conf. No publiques el build privado `dist` ni credenciales de prueba.

Antes de abrir registros públicos: integrar correo verificado/recuperación, política de sesiones y cambio de contraseña, protección antiabuso de borde, revisión independiente y pruebas de restauración. No hay sincronización financiera ni colaboración remota en esta entrega.

Referencias: [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), [Node SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).

Los hashes incluyen versión `scrypt-v2`; un hash local previo se actualiza después de verificar un acceso válido o repetir el bootstrap con la misma contraseña. El costo N=32768/r=8/p=3 sigue una de las configuraciones recomendadas por [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Login por etapas

La pantalla inicial solicita solo email y contraseña. El servidor valida credenciales y devuelve un ticket temporal, no una sesión. La verificación CAPTCHA permanece activa en el paso siguiente (aritmética local, Turnstile en producción). Para perfiles con MFA, el servidor exige un segundo ticket y el código después del CAPTCHA. Usuarios sin MFA acceden al completar CAPTCHA. Ningún paso parcial da acceso autenticado.

Los tickets se guardan hashed en `pending_auth`, expiran en cinco minutos, se consumen al completar su etapa y admiten como máximo cinco intentos. La etapa MFA añade límite por cuenta. Origin exacto y validación estricta también se aplican a `/api/auth/verify`. El login no mantiene la contraseña en estado React ni en esos tickets. El cliente deja de mostrar el campo de contraseña tras validarlo.
