> **Stellar Plus confirmado:** Namecheap ofrece Node en shared hosting. La afirmación anterior de que shared no ejecuta el backend es demasiado general. Consulta [DATABASE_AND_STELLAR_PLUS.md](DATABASE_AND_STELLAR_PLUS.md) para comprobar Node/SQLite, adaptador cPanel, instalación y ruta de escalabilidad.

> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# Publicación en Namecheap

Esta entrega está preparada para **uso local primero**. No se ha publicado ni conectado a tu cuenta. El plan existente determina la ruta: shared/cPanel sirve el frontend y puede ejecutar el backend si ofrece Node y SQLite compatibles; una VPS ofrece mayor control del servicio. El modo local estático no necesita Node ni base servidor. Login/MFA requieren el servicio de identidad Node descrito en AUTH_AND_SETUP.md.

## 0. Preparación privada obligatoria

1. En la app local exporta respaldo y guárdalo fuera del proyecto/hosting.
2. El código inicial contiene tu contexto financiero. Antes de publicar en un dominio accesible públicamente, usa `npm run build:public`. Ese modo sustituye `src/seed.ts` por `src/seed-public.ts` y escribe `dist-public/` sin tu seed financiero. No publiques dist normal, reservado para tu uso privado.
3. Al abrir el dominio por primera vez, importa tu backup desde Ajustes. Ese archivo se lee localmente: no se sube al hosting. Tu IndexedDB sólo vive en ese navegador.
4. No incluir `.env`, JSON de backups, node_modules, estados bancarios o docs con contexto privado en public_html. Sube exclusivamente `dist-public/`.
5. Antes de desplegar: `npm ci`, `npm run check`, `npm audit`, `npm audit --omit=dev`. Revisa versión y conserva la release anterior.

## 1. Shared hosting / cPanel (recomendado para esta versión estática)

### Dominio y DNS

1. Identifica en cPanel el document root del dominio o subdominio. Preferible `finanzas.tudominio.com` si tu dominio principal ya tiene otro sitio; no reemplaces sus archivos.
2. Si DNS lo maneja Namecheap BasicDNS: configura A del host elegido con la IP del hosting que aparece en tu cuenta. Para `www` configura CNAME al dominio correspondiente si lo necesitas.
3. Si el dominio ya usa nameservers del hosting, administra registros desde la zona DNS de cPanel, no desde una zona BasicDNS inactiva. Conserva MX/TXT/SPF/DKIM existentes para no afectar correo.
4. Para dominio adicional/subdominio, crea entrada en cPanel Domains y confirma su directorio. No asumas que siempre es public_html.
5. Espera propagación según TTL y verifica que el host apunte a la IP correcta. No modifiques DNS si ya funciona hacia el plan existente.

### SSL y HTTPS

1. Instala/activa SSL para el host exacto en cPanel SSL/TLS o plugin SSL de Namecheap disponible en tu plan. Verifica que también cubra www si lo usas.
2. Sigue validación DNS/archivo del proveedor. No borres `.well-known` durante actualizaciones si está usado por renovación/validación.
3. Abre https://host y verifica certificado válido antes de activar redirección HTTP→HTTPS.
4. Usa el `.htaccess` incluido (copiado de public al build). La redirección se activa allí. Si hosting usa proxy, confirma regla adecuada con soporte para evitar bucles.
5. Prueba renovación/fecha de expiración. No asumas SSL perpetuo/gratuito en tu plan.

Fuentes oficiales: [SSL en servidores Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/804/69/ssl-certificate-activation-and-installation-for-domains-hosted-on-namecheap-hosting-servers/) y [instalación cPanel](https://www.namecheap.com/support/knowledgebase/article/9418/33/installing-an-ssl-certificate-on-your-server-using-cpanel/).

### Build y subida

```sh
npm ci
npm run check
npm run build:public
cd dist-public
zip -r ../finanzas-static.zip .
```

1. Haz copia de los archivos actuales del document root y anota fecha/release.
2. cPanel File Manager → directorio del host → Upload ZIP → Extract. El contenido de dist-public debe quedar directamente en el document root: index.html, assets/, sw.js, manifest.webmanifest, icon.svg y .htaccess. No una carpeta dist anidada.
3. Habilita “Show Hidden Files” para comprobar .htaccess. No sobrescribas .htaccess de otro sitio; usa un subdominio dedicado.
4. Extrae en carpeta de staging si es posible y cambia el document root o reemplaza de forma controlada para no servir versiones mezcladas. Borra el ZIP público al terminar.
5. Abre HTTPS; crea un movimiento de prueba, exporta, cierra, reabre. Verifica offline y ambos idiomas/temas. Importa tu respaldo privado sólo en tu navegador.
6. Inspecciona headers Network: CSP, nosniff, frame deny, referrer y permissions. Headers pueden requerir mod_headers/mod_rewrite del servidor. Si da500, revisa error log/módulos y pide configuración compatible a soporte.

### Routing y base path

La navegación es estado React sin rutas externas; index en raíz basta y no requiere catch-all SPA. No añadas rewrite que convierta archivos faltantes en HTML: rompe JS/worker. Se recomienda host dedicado en raíz. Si sirves en `/finanzas/`, configura `base:'/finanzas/'` en vite.config.ts y `navigateFallback:'/finanzas/index.html'` en Workbox, usa icon URL relativa y rebuild. Revisa scope del service worker/manifest y prueba recarga offline en esa ruta. Un worker de raíz puede controlar subrutas: no mezclar con otro sitio.

### Cache y actualizaciones

- index.html, sw.js, registerSW.js y manifest: no-cache para actualización.
- assets con hash: cache público 1año immutable.
- El worker precachea revisiones. No cambies nombre DB por actualizar frontend.
- Haz backup antes, genera build, sube nueva release, conserva assets de release anterior hasta que pestañas antiguas se cierren. No borrarlos inmediatamente.
- Cierra todas las ventanas/PWA y vuelve a abrir para activar worker nuevo. Si hay CDN, purga sólo HTML/worker/manifest; los hashes no se purgan normalmente.

### Rollback

Conserva ZIP/release previa fuera del document root. Restaura sus archivos completos (incluyendo worker y .htaccess), conserva mismo dominio/HTTPS y verifica. IndexedDB no se modifica al reemplazar dist. Si una versión futura migra DB de forma incompatible, rollback de frontend no basta: prepara migración reversible o respaldo antes. No borrar almacenamiento como primer paso.

## 2. VPS / Node

Para esta versión, sirve archivos estáticos con nginx. Node se necesita para build y para el servicio de identidad si habilitas login.

1. Configura usuario sin root para operaciones, SSH por clave, actualizaciones del SO y firewall (22 según acceso, 80/443 para web). No expongas puerto de Node directamente.
2. Instala nginx mediante el gestor del sistema. Crea directorio `/srv/finanzas/releases/<fecha>/`; copia dist-public allí vía SFTP/SCP. No copies fuentes privadas/backup.
3. Apunta un enlace `/srv/finanzas/current` a esa release. Da permisos de lectura a nginx y escritura sólo al usuario de despliegue.
4. Configura A/AAAA del host con IP del VPS; elimina AAAA incorrecto para evitar fallos intermitentes.
5. Emite certificado del host con un cliente ACME compatible o instala certificado Namecheap con cadena y clave privada fuera de la web. Provisiona inicialmente HTTP para validación; sólo después usa el bloque TLS completo.
6. Adapta `docs/nginx.conf`, certificados y host; incluye archivo en sites-enabled según distribución.
7. `sudo nginx -t` y `sudo systemctl reload nginx`. Verifica HTTPS, headers, MIME de JS y no-cache del worker. Configura renovación automática y pruébala.
8. Para actualizar: sube release nueva, verifica staging, cambia symlink de current atómicamente y recarga nginx. Conserva releases previas; los assets viejos deben seguir disponibles durante transición.
9. Rollback: apunta current a release anterior; no borres DB del navegador.

### Identidad Node implementada; sincronización futura

Desarrolla servicio separado, con secretos en entorno de systemd, fuera de document root y permisos600. Ejecuta usuario restringido, `NODE_ENV=production`, escucha127.0.0.1:3001, reinicio con systemd. Proxy `/api/` desde nginx para mismo origen. Añade sesiones/autorización/CSRF/rate limits/DB y backups antes de exponerlo. No uses `vite preview` ni `npm run dev` como servidor producción. No existe un comando de inicio API en este proyecto porque actualmente no hay API.

## 3. Limitaciones y verificación

Shared hosting sirve esta PWA sin problema cuando admite archivos estáticos y headers. La disponibilidad de Node, procesos permanentes, cron, bases y controles depende del plan; no se presupone que soporte sync/IA segura. Puede usarse backend externo o VPS después de implementarlo. Static deployment no sincroniza dispositivo alguno ni genera usuarios.

Comprobación:

```sh
curl -I https://finanzas.tudominio.com/
curl -I https://finanzas.tudominio.com/sw.js
curl -I https://finanzas.tudominio.com/.env
```

.env debe ser404/403, no200 con contenido. Si una página HTTPS intenta cargar HTTP, corrige recursos/base; no relajes TLS. Si pantalla vacía: revisa asset404, MIME, CSP, base y consola. Si worker viejo: cierra clientes, verifica no-cache y purga CDN selectivamente. Si datos “faltan”: confirma mismo origen/perfil o importa respaldo del anterior. Si certificado incorrecto: host/SAN y DNS deben coincidir.

[Vite: despliegue estático](https://vite.dev/guide/static-deploy.html). Fecha de consulta de referencias: 2026-10-05. Los nombres y disponibilidad de interfaces Namecheap varían por plan; usar el document root y configuración reales de tu cuenta.

## Despliegue del login y MFA

En VPS: Node 24.12.x–24.x, `npm ci --omit=dev` en una release de servidor privada; ejecutar `npm run auth` con systemd bajo usuario dedicado. `WorkingDirectory` debe contener package.json/server; `AUTH_DATA_DIR` debe estar en una ruta persistente fuera de las releases y fuera del document root. Definir `NODE_ENV=production`, `APP_ORIGIN=https://tu-dominio`, claves Turnstile y puerto 3001. Configura `/api/auth/` con proxy local como en docs/nginx.conf; no expongas 3001. No usar el usuario de prueba ni copiar server/data local. Las claves CAPTCHA se almacenan en el archivo de entorno de systemd con permisos 0600, nunca VITE_ ni public_html.

La API rechaza producción sin HTTPS/CAPTCHA. El registro público está bloqueado; para bootstrap privado crea una cuenta nueva con contraseña fuerte según AUTH_AND_SETUP.md y activa MFA. El backend no guarda ni sincroniza finanzas. Shared hosting sólo sirve el frontend local, salvo que el plan permita un backend permanente configurado de manera explícita. Para registro público completo falta correo verificado/recuperación y revisión independiente.

Actualizaciones: respaldar identidad y clave MFA junto con backups financieros privados, construir `dist-public`, desplegar release nueva, reiniciar el servicio y probar login/sesión/MFA/CSRF. Las migraciones SQLite actuales son creación aditiva `CREATE TABLE IF NOT EXISTS`; cambios futuros deben versionarse y probarse antes del despliegue. Rollback del frontend no restaura datos de identidad automáticamente; mantener backups y detener el servicio antes de restaurar el directorio. No publicar `dist` privado, archivos SQLite, claves ni backups.
