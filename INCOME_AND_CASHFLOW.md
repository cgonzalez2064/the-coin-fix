# Movimientos, ingresos y reparto del mes

## Registro rápido

Selecciona Gasto/Ingreso/Pago, introduce monto, categoría o destino, cuenta y fecha. La descripción es opcional: si se omite usa la categoría/tipo. “Más detalles” contiene responsable, porcentaje personal y notas. La tasa de cambio sólo aparece para USD.

“Crear categoría” añade una categoría dentro del formulario, sin perder el movimiento. Emergencias y Regalos son accesos rápidos. Su presupuesto inicial es cero para no incrementar tu presupuesto automáticamente; puedes definir un límite en Presupuesto. Categoría, movimiento y recurrencia se guardan dentro de una misma transacción IndexedDB; cancelar no crea registros.

## Repetición opcional

Abre “Repetir cada mes”, activa la opción y elige día 1–31. Guardar registra el movimiento actual; la nueva plantilla comienza el mes siguiente para no duplicar el gasto del mes actual. Para editar/pausar una plantilla existente usa Recurrentes. Los días 29–31 se ajustan al último día de un mes corto. No se cargan gastos reales automáticamente.

Las compras con fecha flexible siguen apareciendo en su fecha elegida como compromiso conservador. La opción documenta que puedes ajustar la fecha: el análisis no cambia vencimientos ni mueve dinero. Los pagos de deuda repetitivos conservan su destino de deuda cuando se registran desde el calendario.

## Ingresos

La sección Ingresos contiene fuentes y cobros del mes. Añade una fuente, define moneda/monto/frecuencia y programa cada cobro con una fecha y monto concretos. Un pago mensual con día conocido genera una previsión en cada mes; una fecha desconocida queda pendiente. Una fuente semimensual requiere dos eventos explícitos: no se inventa la segunda fecha. Las fuentes cada dos meses necesitan fecha de inicio para definir meses alternos.

Puedes editar un cobro generado para cambiar su fecha/monto: `occurrenceDate` identifica la previsión original y evita duplicarla. Registrar recepción abre un movimiento para confirmar cuenta, fecha real y monto recibido. `eventId` y `recurrenceId` evitan contar nuevamente la previsión ya registrada. Si un cobro cambia después de recibido, concilia también su movimiento real. No se maneja recepción parcial automática: registra el monto final recibido y crea otro evento para cualquier remanente confirmado.

## Distribuye tu mes

La sección se actualiza con cada cambio local y muestra:

- Saldo al comienzo del análisis y saldo mínimo proyectado.
- Qué ingreso anterior puede financiar cada compromiso y saldo posterior.
- Importe orientativo para compras variables entre cobros, por período, por día y por categoría.

El motor usa cuentas conciliadas, movimientos históricos con FX congelado, eventos confirmados y previsiones mensuales activas. Los cobros pendientes no aportan liquidez. Los compromisos del mes vencidos y no registrados siguen visibles. En el mes actual empieza desde hoy; en meses pasados/futuros analiza el mes completo.

Antes de repartir presupuesto se restan gastos reales y compromisos de la misma categoría. Se protege la parte pendiente de la reserva de emergencia y el saldo mínimo de todos los compromisos restantes. Cada importe sugerido reduce la liquidez que podrá sugerirse después: no se recomienda gastar el mismo efectivo dos veces. Lo que no puede gastarse antes de un cobro se redistribuye entre los períodos restantes, sin superar el presupuesto mensual disponible.

Los importes son máximos orientativos, no instrucciones para gastar todo el primer día. La cifra diaria permite repartir supermercado, transporte y otras compras a lo largo del período. Expande el detalle por categoría sólo cuando lo necesites.

## Supuestos y límites

Una recepción en el mismo día se supone disponible antes del gasto: verifica horarios bancarios. Las previsiones usan FX actual y los movimientos reales su tasa histórica. No hay integración bancaria, traslado entre cuentas automático ni garantía de cobro. El análisis agrega cuentas: verifica también que la cuenta desde la que pagarás tenga fondos. Añade vencimientos y pagos mínimos de préstamos para que el análisis sea completo; no se inventan obligaciones desconocidas.

## Compatibilidad

Se añadieron campos opcionales: `Entity.categoryId`, `flexible`, `targetId`, `txType`; `Transaction.recurrenceId`, `eventId`; `CashEvent.occurrenceDate`. No cambian las claves/tablas IndexedDB. Los backups anteriores siguen válidos; los backups con campos nuevos requieren esta versión o posterior. Exporta antes de actualizar y conserva la versión anterior para recuperar datos si necesitas rollback.

Código principal: `TransactionEditor.tsx`, `IncomeView.tsx`, `ScheduleList.tsx`, `FundingView.tsx`, cálculos puros en `cashflow.ts` y pruebas en `cashflow.test.ts`.
# The Coin Fix: fecha de registro

Los movimientos nuevos muestran la fecha actual del dispositivo, según su zona horaria local. Puedes cambiarla antes de guardar. Esto también aplica al confirmar un ingreso o gasto del calendario: la fecha prevista permanece en el calendario y el movimiento registra la fecha real seleccionada. Al editar un movimiento existente, se conserva su fecha guardada.

## Orden de ingresos
Las fuentes se muestran de mayor a menor por su equivalente mensual en GTQ usando el tipo de cambio configurado: semimensual ×2, bimestral ÷2 y mensual ×1. Cada tarjeta conserva el importe original por cobro y muestra su equivalente mensual. Los cobros del mes se ordenan por importe equivalente en GTQ; el calendario mantiene su orden cronológico. Esta presentación no cambia registros ni convierte ingresos previstos en recibidos.
