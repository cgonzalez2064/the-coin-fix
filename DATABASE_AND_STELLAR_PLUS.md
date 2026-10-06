# Base de datos y Namecheap Stellar Plus

## Qué existe actualmente
- IndexedDB/Dexie: presupuesto privado en cada navegador y origen (dominio + puerto). La sesión del propietario usa su base; el invitado usa una base vacía separada. Cambiar de sesión no borra deudas del otro presupuesto. Para localizar datos antiguos usa el mismo navegador y URL, o importa un backup.
- SQLite de Node: usuarios, sesiones, MFA, roles y, solo al activar el modo compartido, presupuesto financiero. Se crea automáticamente con `npm run auth`; no necesitas instalar MySQL ni crear una base en cPanel para esta versión.
- No hay conexión PostgreSQL o MySQL implementada. Crear una base en cPanel no cambia el motor del código.

## Instalación local
1. Instala Node >=24.12 y <25. Desde la carpeta del proyecto ejecuta `npm ci`.
2. `npm run db:check`: prueba Node, SQLite integrado y escritura/WAL en un directorio temporal, sin modificar bases existentes.
3. `npm run auth`: crea tablas SQLite si faltan. La carpeta de datos predeterminada es `server/data`; `AUTH_DATA_DIR` permite una ruta absoluta privada.
4. En otra terminal: `npm run dev`. Abre exactamente http://127.0.0.1:5175/.
5. Inicia sesión con tu cuenta para ver su presupuesto privado. Modo invitado no contiene tus deudas. En Deudas se muestra el origen de datos y, si está vacío, cómo volver a la cuenta o importar backup.
6. Exporta un backup de la cuenta; después activa el presupuesto compartido desde Ajustes si quieres centralizar esos datos. La activación copia los datos de ESA sesión al servidor. Da acceso por correo a los demás usuarios.

No copiar cuentas demo ni contraseñas temporales al hosting. La cuenta inicial de producción se configura con `npm run auth:seed` y variables de entorno servidor DEMO_EMAIL/DEMO_PASSWORD (contraseña nueva de mínimo 15 caracteres, guardada en un gestor, no en el frontend). El proceso no cambia contraseñas de cuentas existentes.

## Stellar Plus: no comprar VPS todavía
La documentación de Namecheap lista Setup Node.js App y Node 24.13 para servidores shared, incluidos Stellar Plus. Esto permite evaluar el backend actual, pero no confirma la configuración de tu servidor particular. Verifica:
- cPanel → Setup Node.js App ofrece 24.x >=24.12.
- SSH/Terminal disponible para `npm ci --omit=dev` y `npm run db:check`.
- `node:sqlite` funciona y AUTH_DATA_DIR está fuera de public_html en disco local con escritura y bloqueo WAL.
- Puedes montar el backend bajo `/api/auth` en el mismo dominio HTTPS de la PWA. Comprueba GET `/api/auth/session`: debe devolver JSON, no index.html ni un error de Passenger.
- Cookies HttpOnly/Secure, Origin y CSRF funcionan con el proxy. No habilites CORS general ni cambies SameSite para evitar problemas de montaje.

## Procedimiento de cPanel
1. Construye localmente: `npm run check`, `npm run build:public`. Publica SOLO dist-public en el document root del dominio. No publiques dist privado ni seed financiero.
2. Coloca el backend en una carpeta privada del hosting. Debe contener package.json, package-lock.json, server/, src/model.ts y scripts/check-database.mjs. Instala dependencias dentro del entorno Node indicado por cPanel. No subas node_modules del Mac.
3. En Setup Node.js App elige Node 24 compatible, modo Production, root de la aplicación privada y URL de aplicación `/api/auth`. Startup file: `server/cpanel/app.js`; su package.json local mantiene CommonJS para el cargador mientras la aplicación usa ESM.
4. Variables: NODE_ENV=production, APP_ORIGIN=https://TU_DOMINIO, AUTH_DATA_DIR=ruta privada absoluta y las claves de Turnstile servidor/sitio. Nunca uses VITE_ para secretos. No configures DEMO_PASSWORD como variable permanente del proceso web.
5. Ejecuta `npm run db:check`, inicializa la cuenta propietaria en un proceso separado y reinicia desde cPanel.
6. Prueba GET session y challenge, login, CAPTCHA, MFA, roles y backup/recuperación en staging. Si el montaje elimina el prefijo `/api/auth`, pide a soporte conservarlo o configurar el enrutamiento; no publiques una solución sin verificar ese comportamiento. El adaptador se comprobó con Node local, no en tu cPanel/Passenger.
7. Revisa DEPLOY_NAMECHEAP.md para DNS, SSL, caché, cabeceras y rollback. Mantén el directorio SQLite y mfa.key fuera de las releases sustituidas.

No hay que comprar una base de datos separada para SQLite. La app pública sigue teniendo el registro bloqueado en producción hasta implementar verificación de correo y recuperación de cuentas. El modo compartido es una fase inicial para grupos pequeños; no es todavía una plataforma pública lista para altas masivas.

## Cuándo cambiar a VPS o servicio administrado
Mi recomendación para el lanzamiento público con crecimiento: VPS/servicio Node administrado y PostgreSQL. Stellar Plus puede servir para staging o un piloto si supera las comprobaciones. Cambia antes de necesitar múltiples instancias, escrituras concurrentes intensas, trabajos de fondo, observabilidad avanzada o límites de recursos recurrentes. Una VPS da control, pero requiere mantenimiento, parches y backups; un servicio administrado puede reducir esa carga.

SQLite permite un escritor por archivo. El servidor actual sincroniza un documento completo con límite de 5 MB y revisión optimista; cambiar SQLite por PostgreSQL sin rediseñar la API no elimina ese límite. La migración escalable debe incluir:
1. Tablas normalizadas de presupuestos, miembros, cuentas, categorías, deudas, movimientos y auditoría; claves de presupuesto en todas las consultas.
2. API por recurso con paginación y validación de rol por operación, evitando reenviar todo el presupuesto.
3. Cambios incrementales por versión y cola offline con resolución explícita de conflictos.
4. Migración repetible desde backups, comparación de saldos y referencias, pruebas de aislamiento y rollback.
5. Recuperación de cuentas, email verificado, observabilidad sin datos financieros y pruebas de carga antes de abrir registro.

Para montar PostgreSQL en una futura versión se necesitarán host, puerto, nombre de base, usuario de aplicación con privilegios mínimos, contraseña por canal seguro y CA/TLS; NO envíes esos secretos por este chat. No hay DATABASE_URL funcional en esta versión ni migraciones PostgreSQL que ejecutar todavía.

## Información que necesitamos de tu lado
Ya confirmado: Stellar Plus. Pendiente para configurar el despliegue: dominio/subdominio elegido, confirmación de Setup Node.js App y su versión, SSH/Terminal, ubicación privada de archivos y estrategia de backups. Turnstile se configura en tu cuenta; sus secretos se introducen directamente en las variables del servidor. No necesito tu contraseña de Namecheap/cPanel.

## Fuentes verificadas el 6 de octubre de 2026
- [Node.js en cPanel Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/)
- [Versiones del software por plan](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/)
- [Límites de recursos del shared hosting](https://www.namecheap.com/support/knowledgebase/article.aspx/1127/103/a-handy-guide-to-resource-limits-or-what-is-lve/)
- [Cuándo usar SQLite o un motor cliente/servidor](https://www.sqlite.org/whentouse.html)
