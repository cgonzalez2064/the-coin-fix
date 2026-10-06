> **Start on Mac:** [MAC_LOCAL_SETUP.md](MAC_LOCAL_SETUP.md). **Public repository privacy:** [GITHUB_AND_PRIVACY.md](GITHUB_AND_PRIVACY.md). This repository contains neutral defaults and synthetic tests; no personal financial seed.

> **Stellar Plus confirmado:** Namecheap ofrece Node en shared hosting. La afirmación anterior de que shared no ejecuta el backend es demasiado general. Consulta [DATABASE_AND_STELLAR_PLUS.md](DATABASE_AND_STELLAR_PLUS.md) para comprobar Node/SQLite, adaptador cPanel, instalación y ruta de escalabilidad.

> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# The Coin Fix · local-first personal finance

Aplicación PWA de finanzas personales con hogar configurable. React + TypeScript + Vite + Tailwind + Dexie. Español e inglés; oscuro verdadero predeterminado y tema claro. El modo local no necesita cuenta. Login y MFA usan un servidor de identidad independiente; no se necesita IA.

## Empezar ahora

Requisitos: Node.js 24.12.x–24.x y npm. Abre una terminal en esta carpeta:

```sh
npm ci
# En una terminal:
npm run auth
# En otra terminal:
npm run dev
```

Abre la URL que imprime Vite (http://127.0.0.1:5175). Para una PWA con caché offline real:

```sh
npm run check
npm run preview
```

Abre http://127.0.0.1:4173 una vez con conexión. El service worker se habilita en el build de producción, no en desarrollo. `npm run preview` necesita primero `npm run build` (incluido en `check`). No abras index.html mediante file://.

## Incluido

- Inicio compacto: ingresos, consumo, flujo neto, porcentajes, gráficas y resumen de reservas; detalles financieros desplegables.
- Movimientos: crear, editar, eliminar, buscar por mes; gastos, ingresos, transferencias, pagos y aportes. Exportación CSV.
- Cuentas GTQ/USD con saldo inicial editable; tasas históricas por movimiento.
- Presupuesto por categoría editable; montos originales y recortes documentados.
- Recurrencias mensuales, semimensuales y cada dos meses; eventos manuales explícitos para cobros/pagos. No se inventan fechas.
- Deudas, APR desconocido explícito, mínimos GTQ/USD, mora, pagos y simulador avalancha/bola de nieve.
- Calendario mensual y saldo acumulado de eventos previstos. No equivale al saldo real.
- Metas, fondo de emergencia, aportes e inversión; hogar genérico con integrantes y aportes previstos.
- Respaldo JSON validado con SHA-256 y restauración atómica. Copia de seguridad previa a importar.
- FX remoto sin clave, manual y último valor guardado; remoto desactivado por defecto.
- PWA instalable, caché de aplicación, funcionamiento offline, almacenamiento IndexedDB.

## Primera configuración

1. En **Cuentas**, introduce los saldos iniciales reales. Los saldos iniciales precargados son Q0: no se inventa efectivo.
2. Revisa **Deudas** con tus estados actuales. Los saldos son del contexto histórico, no saldos bancarios en vivo. Introduce APR y mínimos pendientes.
3. Revisa **Presupuesto**: Define límites editables, incluyendo provisiones. Evita duplicar higiene y limpieza con supermercado.
4. En **Calendario**, confirma los eventos de octubre. Registrar recepción abre un movimiento, que debes guardar. Fechas futuras no cuentan como dinero recibido hoy.
5. Ajusta FX en **Ajustes** o consulta al proveedor voluntariamente. Q7.64136 es una referencia histórica, no cotización actual.
6. Haz un respaldo antes y después de cambios importantes.

## Comandos

| Acción | Comando |
|---|---|
| Dependencias reproducibles | `npm ci` |
| Desarrollo local | `npm run dev` |
| Pruebas financieras | `npm test` |
| Lint | `npm run lint` |
| TypeScript y producción | `npm run build` |
| Preview producción | `npm run preview` |
| Todas las comprobaciones | `npm run check` |
| Auditoría dependencias | `npm audit` |
| Sólo riesgos runtime | `npm audit --omit=dev` |
| Build para hosting público (sin seed privado) | `npm run build:public` |
| Paquete compartido/cPanel | `cd dist-public && zip -r ../finanzas-static.zip .` |

## Documentación

- [INCOME_AND_CASHFLOW.md](INCOME_AND_CASHFLOW.md): registro rápido, categorías, repetición, cobros y reparto por fechas.

- [TECH_STACK.md](TECH_STACK.md): herramientas, versiones y dónde cambiar cada parte.
- [ARCHITECTURE.md](ARCHITECTURE.md): funcionamiento y extensión IA/sync.
- [DATA_MODEL.md](DATA_MODEL.md): entidades, dinero, invariantes y contexto.
- [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md): instalación, móvil, PWA y depuración.
- [SECURITY.md](SECURITY.md): modelo de privacidad, límites, CSP y dependencias.
- [DEPLOY_NAMECHEAP.md](DEPLOY_NAMECHEAP.md): shared/cPanel, DNS, SSL, VPS, actualizaciones y rollback.
- [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md): recuperación y portabilidad.
- [CONTRIBUTING.md](CONTRIBUTING.md): cómo modificar y verificar.
- [MULTI_USER.md](MULTI_USER.md): modo público actual y diseño seguro para registro, cuentas y sincronización.

## Límites honestos

Hay login, registro para pruebas locales y MFA; no hay sincronización entre dispositivos. El registro público en producción está bloqueado hasta integrar correo verificado y recuperación. Transferir un backup reemplaza la base destino. El build público neutro (`npm run build:public`) está diseñado para que otras personas usen la app sin recibir tu seed privado. No hay banca conectada, facturación, importación de estados CSV, sincronización remota, cifrado local ni proveedor IA implementado. CSV es exportación; JSON es el formato de importación. Los mínimos/calendarios no se actualizan automáticamente desde bancos. El simulador necesita tasas conocidas, omite cargos y usa APR/12. La ruta segura para registro y sync está documentada en MULTI_USER.md.

- [AUTH_AND_SETUP.md](AUTH_AND_SETUP.md): instalación del servidor, SQLite, credenciales locales, MFA, CAPTCHA y límites reales.
- [FINANCIAL_FEATURES.md](FINANCIAL_FEATURES.md): análisis del contexto y funciones propuestas para elegir.

## Presupuesto y simulaciones

Consulta [BUDGET_AND_PROJECTIONS.md](BUDGET_AND_PROJECTIONS.md) para los grupos, agenda recurrente, importación y supuestos de las proyecciones.

## Organización, temas y cuotas

[CATEGORIES_THEMES_AND_INSTALLMENTS.md](CATEGORIES_THEMES_AND_INSTALLMENTS.md) explica los grupos generales/específicos, Hogar configurable, resúmenes mensuales, cuatro temas y planes opcionales de capital. El login ahora solicita primero email/contraseña y completa CAPTCHA y MFA en etapas posteriores.
