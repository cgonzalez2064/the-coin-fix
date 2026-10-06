> **Stellar Plus confirmado:** Namecheap ofrece Node en shared hosting. La afirmación anterior de que shared no ejecuta el backend es demasiado general. Consulta [DATABASE_AND_STELLAR_PLUS.md](DATABASE_AND_STELLAR_PLUS.md) para comprobar Node/SQLite, adaptador cPanel, instalación y ruta de escalabilidad.

# Presupuesto compartido, permisos y sincronización

## Activar y dar acceso
1. Ejecuta la web y el servicio Node (`npm run dev` y `npm run auth` en terminales distintas). Usa Node >=24.12 y <25. El servicio utiliza SQLite integrado y la eliminación nativa de tipos TypeScript para importar `src/model.ts`; conserva ese archivo con el servidor.
2. Inicia sesión con la cuenta propietaria. En Ajustes → Presupuesto compartido, pulsa Activar presupuesto compartido. Se copia el presupuesto actual al servidor de ESTA instalación. Antes, exporta un backup. No se activa por defecto.
3. Añade el correo de cada persona y el rol. Esto permite el acceso por correo, no crea contraseñas ni envía invitaciones por email. Cada persona debe crear su cuenta con ese correo en esta misma instalación y volver a entrar si ya tenía sesión abierta. El registro local está habilitado; en producción sigue bloqueado hasta integrar verificación de email y recuperación de cuentas. Puedes autorizar cuentas existentes; no deshabilites esa protección para publicar sin completar dicho flujo.
4. El administrador puede actualizar permisos o retirar acceso. El propietario siempre mantiene su rol administrador. Un usuario solo puede pertenecer a un presupuesto compartido. Administradores secundarios pueden gestionar usuarios, así que concede este rol solo a personas de confianza.

## Permisos efectivos
| Rol | Lectura | Agregar gastos | Agregar ingresos | Editar/eliminar registros y configuración | Gestionar acceso |
|---|---|---|---|---|---|
| Administrador | Sí | Sí | Sí | Sí | Sí |
| Contribuyente | Sí | Sí | Sí | No | No |
| Visualizador | Sí | Sí | No | No | No |

Visualizador puede registrar gastos según la definición solicitada; no es estrictamente un rol de solo lectura. Los usuarios limitados agregan movimientos sobre cuentas y categorías existentes; la creación de categorías, programación y pagos de deuda o transferencias queda a cargo del administrador. Los cambios de tema, idioma, nombre del perfil y moneda de visualización son personales.

## Seguridad y almacenamiento
La ruta POST `/api/auth/shared` verifica sesión y CSRF antes de leer o escribir. El servidor obtiene el rol desde SQLite, valida el esquema estricto y referencias, compara el documento anterior y rechaza alteraciones de entidades/eventos/configuración, modificación/eliminación de movimientos existentes y tipos no autorizados. No confía en el rol enviado por el navegador. Usa consultas parametrizadas y revisiones optimistas. La lectura también necesita autenticación. Los límites de solicitudes existentes se mantienen; esta ruta admite como máximo 5 MB.

Al activar, SQLite `server/data/auth.sqlite` contiene también datos financieros compartidos (tablas workspaces/workspace_members). El directorio es privado (0700) y la base (0600). Los datos financieros NO están cifrados en reposo por la aplicación; protege disco y backups del servidor. `mfa.key` sigue cifrando secretos MFA, no el presupuesto. No coloques server/data ni la clave dentro de public_html.

El navegador guarda una copia IndexedDB por usuario. Retirar acceso impide nuevas consultas/escrituras en el servidor; no puede revocar copias descargadas, exportadas o disponibles offline. Cerrar sesión cambia de base local, pero no borra automáticamente la copia anterior. Usa dispositivos confiables y perfiles de navegador independientes.

## Sincronización y conflictos
Los cambios locales se envían tras 650 ms y se consultan actualizaciones cada 10 segundos. La interfaz distingue guardado local de confirmación en servidor. Sin conexión o ante rechazo, se muestra un aviso y los cambios quedan pendientes; no se considera sincronización exitosa. El botón Guardar copia local y recargar exporta el estado pendiente antes de reemplazarlo por la versión del servidor. No hay combinación automática de cambios concurrentes. Al retirarse el acceso, hay que cerrar sesión. Esta es una implementación compartida inicial, no un motor de sincronización de gran escala ni una auditoría independiente.

## Despliegue y recuperación
Un hosting exclusivamente estático sirve la PWA local; cPanel con Node compatible puede ejecutar la API si supera las comprobaciones de DATABASE_AND_STELLAR_PLUS.md. Compartir presupuesto y autenticar requieren Node compatible y proxy HTTPS bajo el mismo dominio (VPS o servicio Node autorizado). Conserva server/, src/model.ts y dependencias de producción; mantén rutas `/api/auth/` fuera de la caché PWA. Sigue DEPLOY_NAMECHEAP.md para DNS, HTTPS, cookies Secure y Turnstile. No publiques el seed privado.

Respaldar solo IndexedDB ya no basta cuando se activa el modo compartido. Para una copia consistente, detén el servicio y copia el directorio server/data completo (SQLite, WAL/SHM si existen y mfa.key), o utiliza la API de backup de SQLite. Cifra la copia fuera del directorio público. Restaurar un backup del servidor restaura tanto identidades y roles como presupuesto. Nunca mezcles la clave MFA de otra instalación. Después, reinicia el servicio y valida acceso, roles y versión.
