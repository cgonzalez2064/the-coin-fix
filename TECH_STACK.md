# Tech stack y guía para cambios

## Herramientas utilizadas

| Herramienta | Función | Ubicación |
|---|---|---|
| React 19 | UI declarativa, estados y formularios | src/main.tsx |
| TypeScript 5 | Contratos y comprobación estática | src/model.ts, tsconfig.json |
| Vite 7 | Servidor local y build estático | vite.config.ts |
| Tailwind CSS 4 | Pipeline CSS, utilidades disponibles | @tailwindcss/vite, src/style.css |
| CSS variables y media queries | Sistema visual completo, temas, responsive | src/style.css |
| Dexie 4 | Persistencia y transacciones IndexedDB | src/db.ts |
| dexie-react-hooks | Actualización reactiva al cambiar DB | useLiveQuery en main.tsx |
| Zod 4 | Validación runtime de formularios y backups | src/model.ts |
| Lucide React | Iconos SVG locales | main.tsx |
| vite-plugin-pwa / Workbox | Manifest y precaché offline | vite.config.ts |
| Vitest 5 | Pruebas de cálculo y respaldo | src/model.test.ts |
| ESLint 9 / typescript-eslint | Calidad y errores básicos | eslint.config.js |
| ExchangeRate-API open endpoint | USD/GTQ diario sin clave | services.ts; opt-in |

`package-lock.json` fija las versiones exactas; usa `npm ci`. Consulta `npm ls --depth=0` para conocer versiones instaladas. No se usan fuentes, imágenes ni analytics remotos. En producción el CAPTCHA carga el widget oficial de Cloudflare Turnstile. No se añadió biblioteca de gráficos: gráficas SVG nativas accesibles y calendario CSS reducen peso y superficie de dependencias. Tailwind está integrado; las clases semánticas CSS concentran el diseño para facilitar modificaciones.

## Mapa de personalización

- Textos: `src/i18n.ts` contiene diccionarios ES/EN. `CopyKey` garantiza claves equivalentes en UI. Nombres personalizados son datos, no traducciones automáticas. Categorías iniciales tienen `enName`.
- Categorías y montos: editar dentro de la app. `src/seed.ts` cambia sólo nuevas instalaciones; no sobrescribe bases existentes.
- Tema y tamaños: variables al inicio de `src/style.css`; override `[data-theme=light]`; breakpoints 1200/760 px. Cambia acento y radio allí.
- Reglas financieras: `src/model.ts`; añade pruebas antes de modificar redondeo, conversiones o simulación.
- Señales: cálculo `insights` en `main.tsx`; se recalcula con cada escritura Dexie.
- Nuevas monedas: cambiar enum `currency`, schemas, formularios, FX, funciones y pruebas; no basta añadir una opción visual.
- Datos iniciales privados: `src/seed.ts`. Antes de publicar una versión pública, usa build:public para sustituir el módulo por seed-public.ts al compilar.
- Política FX: `services.ts`, CSP en index.html y public/.htaccess, docs/nginx.conf.
- PWA: `vite.config.ts`, iconos `public/`. No cachear respuestas financieras remotas.

## Entorno

No requiere variables de entorno. `.env.example` explica que VITE_ es público. Cualquier futura clave IA pertenece a un proceso servidor separado y nunca a `.env` con prefijo VITE_. Variables sugeridas para ese futuro servidor: `AI_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `ALLOWED_ORIGIN`; no están utilizadas por esta versión.

Referencias: https://react.dev/ · https://vite.dev/guide/ · https://tailwindcss.com/docs · https://dexie.org/docs/ · https://zod.dev/ · https://vite-pwa-org.netlify.app/ · https://vitest.dev/ · https://www.exchangerate-api.com/docs/free

## Identidad y nuevas vistas

Node 24.12.x–24.x, `node:http`, `node:crypto` y `node:sqlite` implementan la identidad sin framework adicional. SQLite usa consultas preparadas; Zod valida los requests. `server/crypto.mjs` contiene scrypt, TOTP y AES-GCM; `server/index.mjs` sesiones, CSRF, límites y Siteverify. `src/Auth.tsx` implementa acceso/MFA; `src/Dashboard.tsx`, `analytics.ts`, `SavingsSummary.tsx` y `Household.tsx` separan vistas y cálculos. `src/refinement.css` contiene las animaciones con soporte reduced-motion. Los chunks separan React, almacenamiento y validación para mejorar caché. Pruebas Node complementan Vitest.

## Visualización por áreas

BudgetAllocation, AreaSummary y DebtCharts utilizan barras CSS y SVG con cifras visibles. budgetAreas.ts agrupa gastos en una sola pasada, clasifica rubros y calcula escenarios de cuotas. AreaManager edita grupos y selección de Hogar; main.tsx guarda cambios de nombres y asignaciones atómicamente en IndexedDB. Los cuatro temas usan variables CSS sin nuevas dependencias.
