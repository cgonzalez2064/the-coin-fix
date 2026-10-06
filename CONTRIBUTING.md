# Contribuir / modificar

1. Crea una copia del proyecto o branch Git. Exporta tu base antes de cambios de schema.
2. `npm ci`, `npm run dev`.
3. Cambia la menor parte necesaria; sigue mapa en TECH_STACK.md.
4. Agrega pruebas de invariantes financieros (no snapshots que sólo repitan JSX). Las pruebas deben cubrir saldos, conservación de transferencias, redondeo, mínimos y desconocidos cuando se cambien.
5. `npm run check` y auditoría de dependencias.
6. Revisa manualmente escritorio/móvil, ES/EN, dark/light, navegación por teclado, creación/edición/eliminación, importación/exportación y offline en build.
7. Actualiza DATA_MODEL/ARCHITECTURE cuando cambien semánticas. Schema DB requiere migración y backup versionado compatible.
8. Revisa que diff no incluya secretos ni respaldos. Publicación pública requiere neutralizar seed financiero.

Preferencias: nombres explícitos, funciones puras para dinero, null para desconocido, nunca tratar previsto como recibido, no red automática sin consentimiento, texto plano en notas, accesibilidad y mensajes comprensibles. Evita dependencias por funciones menores que se pueden resolver nativamente. No añadir telemetría ni sincronización implícita.

## Extensiones

Separar vistas en carpetas feature si crecen; incorporar logging de error sin datos privados; saldo USD nativo por lotes, contabilidad entera en centavos, reembolsos compartidos, intereses/cargos como entidades y movimientos, rollover de provisiones son extensiones que necesitan modelo y pruebas, no sólo botones. IA/sync se rigen por ARCHITECTURE.md y SECURITY.md y permanecen desactivadas en esta entrega.
