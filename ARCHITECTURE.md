> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# Arquitectura

Actualización del flujo de ingresos y gastos: ver INCOME_AND_CASHFLOW.md. `cashflow.ts` genera previsiones mensuales activas y asignaciones de liquidez sin escribir movimientos futuros; `TransactionEditor.tsx` guarda movimiento/categoría/plantilla atómicamente. Las fechas desconocidas y los dos cobros semimensuales continúan requiriendo eventos explícitos.

## Flujo local

UI React → schemas Zod → Dexie → IndexedDB → useLiveQuery → UI. Los cálculos son funciones puras. La base es `finanzas-private-v1`, versión 1. Un seed se inserta en una transacción sólo si no existe `settings/main`. Nunca se rellenan datos encima de una instalación existente.

Una escritura de movimiento se valida estructuralmente y por referencias antes de guardarse. Importar valida todo el snapshot y reemplaza tablas dentro de una transacción: un error aborta la restauración. El estado visual (página, filtro mensual, modal) vive en React, los datos y preferencias en Dexie. El filtro mensual empieza en el mes local actual; para revisar el contexto selecciona octubre 2026.

El saldo real usa movimientos con fecha ≤ hoy. El ingreso estable normaliza recurrencias activas sin representar efectivo cobrado. Calendario usa eventos explícitos confirmados y pendientes: no ejecuta recurrencias ni movimientos silenciosamente. Una recurrencia actúa como plantilla para crear un evento; las fechas desconocidas permanecen sin fecha. Se pueden generar eventos de cualquier mes con la acción correspondiente y editar su monto/fecha. Esto evita inventar la segunda fecha semimensual de Dynamic o el primer pago de Meteor.

## Separación de responsabilidades

- model.ts: schemas y cálculos, sin UI ni red.
- seed.ts: contexto inicial y fábrica de entidades.
- db.ts: IndexedDB, seed, exportación snapshot, reemplazo atómico.
- services.ts: FX público, digest, backup, descarga y contrato IA.
- i18n.ts: textos de producto.
- main.tsx: vistas, navegación y editor genérico tipado por schemas.
- style.css: diseño y temas.

Para expandir el producto, extrae cada vista de main.tsx a `src/features/<feature>/` cuando necesite lógica propia, conservando los contratos de model.ts. No se requieren servidores para el artefacto `dist/`.

## Service worker

Workbox precachea el shell, JS, CSS e iconos con revisiones. Sólo se registra en producción. No cachea FX ni hace background sync. Las escrituras offline llegan directamente a IndexedDB y no necesitan cola remota. Para actualizar, cierra todas las ventanas de la app y vuelve a abrir; un worker actualizado espera a que el anterior deje de tener clientes. No cambies el nombre de DB o borres datos para actualizar el shell.

## IA futura, desactivada

`AISummaryProvider` define resumen sobre agregados, sin claves ni llamadas implementadas. Para habilitarlo: backend separado con sesión autenticada, autorización por usuario, rate limit, protección CSRF si usa cookies, validación de requests, timeout y logs sin finanzas; secreto en entorno servidor. UI debe pedir consentimiento explícito y mostrar qué agregados saldrán. La respuesta se renderiza como texto, nunca HTML. No permitir acciones de escritura a un modelo. Fallos de IA no afectan funciones locales. No enviar notas, nombres ni transacciones crudas por defecto.

## Sync futura, desactivada

Añadir servidor no sincroniza mágicamente. Antes de implementarlo define usuario/tenant, IDs estables, revisión por registro, historial de cambios, tombstones y política de conflictos. Usa HTTPS, cookies HttpOnly/Secure/SameSite, autenticación robusta y autorización en cada recurso. Incluye exportación y reversión a local. Cada cambio offline irá a una outbox idempotente; servidor asignará versiones. No confiar en un timestamp de cliente para resolver todo. No copiar secretos a IndexedDB. Shared hosting estático no ejecuta este backend; VPS o servicio externo puede hacerlo.

## Límites de dinero

GTQ es base contable interna; USD es moneda original o de presentación. FX actual revalúa saldos iniciales USD/metas/deudas USD; FX de movimientos queda congelado. Las transferencias conservan el importe base. Aportes salen de la cuenta y forman saldo de meta. No se ejecutan inversiones ni transferencias reales. Para una evolución contable más exigente, migra a importes enteros de centavos y lotes USD nativos con una migración versionada; esta versión redondea a centavos cada conversión con Number.

## Identidad y hogar configurables

`AuthGate` verifica sesión antes de abrir el perfil financiero. El owner local conserva `finanzas-private-v1`; otras cuentas abren `coin-user-UUID` con seed neutro. La identidad vive en SQLite en servidor y los datos financieros en IndexedDB; no hay sync. Un aporte previsto del hogar crea/actualiza una recurrencia sin inventar fecha ni transacción real. `members` es opcional para compatibilidad con backups previos. Dos nombres de categorías privadas heredadas se migran a etiquetas genéricas preservando IDs/importes. Las metas aceptan `goalType`; metas previas se clasifican por nombre como fallback.
