> **Actualización v8:** ya existe presupuesto compartido opcional con permisos en servidor. Se activa explícitamente y añade datos financieros a SQLite. Consulta [SHARED_BUDGET.md](SHARED_BUDGET.md) para configuración, límites de registro en producción, permisos, conflictos y backups. Las referencias anteriores a ausencia de sincronización describen el modo local sin activar.

# Respaldos y recuperación

## Exportar

Ajustes → Exportar respaldo. Se descarga `the-coin-fix-YYYY-MM-DD.backup.json` con envelope format, version1, timestamp, payload serializado y digest SHA-256. Incluye todas las entidades, movimientos, eventos y preferencias; no incluye caches del navegador. No hay cifrado integrado. Guarda el archivo en disco cifrado o contenedor cifrado que controles. Mantén una segunda copia privada fuera del dispositivo. Nunca en public_html, dist, Git público o correo abierto.

Frecuencia sugerida: semanal, después de conciliar estados y antes de actualizar/importar/borrar datos. Guardar el proyecto no respalda tu IndexedDB. El navegador puede expulsar almacenamiento bajo presión, un usuario puede borrarlo y modo privado puede eliminarlo al cerrar. Mantén respaldos externos.

## Restaurar

1. Abre la app en el origen destino correcto. Haz backup de la información que quieras conservar.
2. Ajustes → Importar respaldo → selecciona JSON generado por la app.
3. Se comprueban formato, versión, tamaño, digest, schemas y referencias.
4. Confirma reemplazo. Antes de escribir se descarga una copia del estado actual; verifica que el navegador no haya bloqueado descargas.
5. La restauración reemplaza entidades, movimientos, eventos y preferencias atómicamente. No mezcla bases. Se re-renderiza en tiempo real.
6. Revisa cuentas, deudas, calendario y número de movimientos contra el origen.

Un fallo antes/durante transacción deja la base anterior. Un checksum válido sólo detecta corrupción, no firma de autenticidad. Sólo importa archivos confiables y guarda la copia anterior hasta verificar.

## Cambiar dispositivo, dominio o puerto

IndexedDB depende del origen completo (protocolo+host+puerto) y perfil del navegador. Exporta en el anterior e importa en el nuevo. HTTPS en tu dominio no comparte datos con localhost. Teléfono/PC no sincronizan. Para traslado manual decide qué dispositivo es fuente de verdad; reemplazar el destino puede perder movimientos recientes del destino. No usar backups como mecanismo de sincronización concurrente.

## Recuperación ante errores

- DB borrada: reinstala/abre app e importa el último JSON.
- Actualización mala: restaura archivos dist anteriores conservando origen; no borres DB. Sólo importa snapshot previo si los datos fueron dañados.
- Backup inválido: conserva el archivo, vuelve a origen original para exportar; no ignores validación. Si origen desapareció, busca una copia anterior.
- CSV: sirve para análisis externo, no recuperación integral. Categorías/metas/settings no están allí y esta versión no importa CSV.
- Migración futura: formato nuevo debe añadir conversor versionado y pruebas; version1 no debe reinterpretarse silenciosamente.

## Conciliación

Movimientos son registros manuales. Compara saldo actual con banco; ajusta saldos iniciales cuidadosamente. Pagos de deuda se consideran reducción neta; el saldo base menos historial da restante. Cuando el banco capitaliza interés/cargos, ajusta saldo base para que no se resten pagos dos veces. Para un respaldo histórico íntegro, guarda nota del ajuste y la fecha.

## Identidad y MFA

El backup financiero no incluye cuentas de acceso ni MFA. Respaldar server/data por separado, en almacenamiento cifrado: detener el servicio antes de copiar auth.sqlite, mfa.key y los archivos WAL/SHM que existan. Restaurar el conjunto consistente con el servicio detenido, mantener permisos privados y reiniciar. No copiar esta base temporal al hosting. Los ZIP de entrega excluyen este directorio y todas las variables secretas. Cada perfil financiero exporta su propio backup.
