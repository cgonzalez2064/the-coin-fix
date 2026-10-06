> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# Seguridad y privacidad

## Modelo de confianza

Datos guardados en IndexedDB del navegador/origen. No se envían a un backend, telemetría, IA o nube. La única red opcional de la aplicación es una petición pública FX que comparte IP y metadatos normales de red con ExchangeRate-API, pero no transacciones. Remoto desactivado inicialmente; se puede consultar manualmente o activar actualización diaria al abrir.

Hay autenticación de servidor opcional, pero no cifrado de la base financiera local. Cualquier persona con acceso al perfil del navegador/dispositivo puede leer tus datos. Usa bloqueo de pantalla, usuario del SO, cifrado del disco y perfil privado propio. En un dispositivo compartido no es una bóveda. Un backup es JSON legible; SHA-256 detecta corrupción accidental, NO demuestra autenticidad frente a alguien que puede modificar contenido y digest.

**El seed contiene información privada en el código público.** Local está autorizado y útil. Antes de desplegar públicamente, exporta tu base y ejecuta `npm run build:public`, que sustituye el módulo seed por `src/seed-public.ts` y genera dist-public sin registros financieros iniciales. No publiques dist normal. Luego importa tu backup en tu navegador del dominio HTTPS. No subas el backup ni el repositorio con seed financiero a un servidor público. La IndexedDB del usuario no forma parte de dist.

## Controles implementados

- Validación Zod estricta: tipos, enums, UUID, importes finitos, límites, fechas y porcentajes. Notas máximo2000, nombres160.
- Referencias validadas y restricción de eliminación de entidades vinculadas.
- React renderiza texto escapado. No hay dangerouslySetInnerHTML, scripts desde notas, HTML importado, eval ni new Function en código de aplicación.
- CSV neutraliza prefijos =,+,-,@ antes de escapar comillas para reducir inyección de fórmulas. El JSON es la fuente de recuperación.
- Backup versionado/digest SHA-256, límite25 MB, validación previa y transacción DB atómica. Descarga copia previa antes de reemplazar.
- Service worker precachea sólo recursos de aplicación locales; no guarda información de API, ni usa sync remoto.
- No claves, cookies remotas, fuentes CDN o telemetría.
- CSP en HTML y ejemplos de headers Apache/nginx: script-src self sin unsafe-eval; object-src none; base/form self; connect restringido al FX; worker self.
- X-Content-Type-Options, Referrer-Policy, Permissions-Policy y protección framing en hosting. frame-ancestors sólo funciona en header HTTP, no meta.

`style-src unsafe-inline` está permitido por compatibilidad UI/build; no se permite scripts inline ni eval. Si introduces CSS-in-JS/estilos externos, revisa política. Para máximo aislamiento sin FX, quita open.er-api.com de connect-src y mantén actualizaciones remotas desactivadas. Development/HMR usa política distinta de facto por Vite; headers estrictos se verifican en producción. No uses servidor dev como hosting público.

## Despliegue

Servir sólo dist, HTTPS válido, sin directorios listados. Nunca incluir .env, backup, node_modules, fuentes privadas ni credenciales. .htaccess protege archivos sensibles como defensa extra, no como razón para subirlos. HSTS puede agregarse tras verificar HTTPS y todos los subdominios afectados; no usar preload/includeSubDomains sin revisión. Los headers dependen de módulos Apache del plan; verificar en Network y con curl.

## Dependencias

Usa npm ci y package-lock.json. Ejecuta npm audit y npm audit --omit=dev antes de publicar. Revisa advisories y actualiza conscientemente; evita audit fix --force sin revisar compatibilidad. Las herramientas de build/test no se publican en dist, pero también se auditan. No ejecutar repositorios o scripts de terceros sin revisión. Consulta VALIDATION.md para resultado de la auditoría de esta entrega; cero hallazgos es una comprobación puntual, no garantía futura.

## Backend futuro

No habilitado. Debe implementar autorización por recurso/usuario, sesiones seguras, protección CSRF, rate limits, validación server-side, cifrado en tránsito, respaldos, control de acceso y secretos servidor. El frontend nunca almacena API keys. IA debe recibir sólo agregados con consentimiento y no escribir dinero. Logs no deben incluir notas/saldos personales.

Para el diseño completo de registro, workspaces, roles, conflictos de sync, PostgreSQL y OIDC, consulta [MULTI_USER.md](MULTI_USER.md). No habilites registro guardando contraseñas en IndexedDB: el modo estático funciona localmente; el servidor implementa login/MFA. El registro público sigue bloqueado hasta integrar verificación de correo.

## Incidentes

Si sospechas exposición: exporta a almacenamiento protegido, deja de usar el origen comprometido, revisa extensiones/perfil, reinstala la app desde fuentes conocidas, restaura en origen limpio. Si compartiste un backup, asume que el destinatario puede leerlo; no se puede revocar. Si añadiste backend, rota secretos y sesiones según su guía propia.

## Identidad implementada

Ver [AUTH_AND_SETUP.md](AUTH_AND_SETUP.md) para cookies, CSRF, scrypt, SQL preparado, TOTP, CAPTCHA, límites y backups de identidad. Nunca publicar server/data ni copiar el usuario temporal a producción. La identidad no protege archivos de IndexedDB contra quien controle el dispositivo. Turnstile se carga sólo cuando el servidor declara modo producción; supone una conexión al proveedor de CAPTCHA, sin envío de finanzas.

Zod se configura con `jitless:true`: no intenta generar funciones dinámicas para validar. La CSP no permite unsafe-eval. React renderiza nombres y notas como texto; la app no usa dangerouslySetInnerHTML.
