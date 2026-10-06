# Presupuesto, agenda y proyecciones

## Presupuesto

Los presupuestos iniciales son neutros. Cada usuario define sus categorías, límites y provisiones; los límites no son gastos registrados ni pagos bancarios.

La búsqueda encuentra nombres de categorías en el idioma activo sin distinguir mayúsculas. Los filtros muestran Esenciales, Variables o Provisiones y otros; cada grupo muestra el subtotal de los resultados visibles. El total mensual de arriba siempre incluye todas las categorías. Se pueden editar importes, nombre y grupo. Regalos y Emergencias comienzan en cero para que cada persona decida su provisión.

La actualización privada se aplica una sola vez al iniciar: conserva IDs, referencias de movimientos y provisiones no incluidas en la tabla. `settings.budgetRevision` evita restablecer futuras ediciones o recrear categorías eliminadas. El build público contiene únicamente categorías neutrales y cero importes personales. Antes de cualquier cambio manual grande, exporta un backup desde Ajustes.

## Recurrentes

Una plantilla define importe, moneda, frecuencia, día y fecha inicial de un ingreso o gasto repetido. Para un gasto, selecciona su categoría. Día 0 significa fecha desconocida. Las fechas semimensuales desconocidas requieren eventos explícitos; no se inventa un segundo cobro. Día 31 se limita al último día de meses más cortos.

1. Crear o editar plantilla en Recurrentes, o activar repetición opcional al registrar un movimiento.
2. Revisar previsiones en Calendario y reparto en Ingresos.
3. Registrar un movimiento cuando el pago o cobro suceda realmente.

Pausar detiene previsiones futuras; no elimina movimientos ya registrados. Crear un evento modifica la agenda, no el saldo de cuentas. Ingresos recibidos y gastos reales provienen únicamente de movimientos fechados hasta hoy.

## Dashboard

Compara ingresos recibidos, gastos registrados, presupuesto y una estimación conservadora al cierre. La estimación es el máximo de:

- Presupuesto mensual.
- Gastos reales + gastos recurrentes sin registrar y movimientos de gasto fechados en el futuro.
- Gasto real / días transcurridos × días del mes.

Un compromiso vinculado a un movimiento ya registrado no se cuenta dos veces. La estimación excluye deuda, aportes a metas y eventos aislados sin fuente recurrente; esos eventos permanecen visibles en Calendario/reparto. Es un escenario de planificación, no una certeza. Sin movimientos, los importes reales son cero; no se convierte el presupuesto en consumos ficticios.

## Proyección simplificada de ahorros

En Ahorro e inversión, elige un mes y año objetivo o una duración en meses/años (máximo 600 meses/50 años). El mes actual muestra el ahorro inicial sin añadir aportes; una fecha pasada muestra un aviso. Cada mes futuro añade un aporte constante al cierre del mes.

Ahorro inicial: aportes registrados a metas de ahorro y emergencia hasta hoy. Se excluyen las inversiones. Aporte mensual por defecto: suma de aportes a esas metas de los tres meses calendario completos anteriores / 3, incluidos meses sin aportes. Los aportes del mes actual no se extrapolan para evitar sesgos por un mes incompleto.

`ahorroProyectado = ahorroInicial + aporteMensual × meses`.

En el apartado opcional «Ver o ajustar el ahorro mensual» puedes modificar el aporte para este escenario y volver a usar los registros. No guarda movimientos ni cambia tu presupuesto; los ajustes se reinician al salir de la sección. Los ingresos previstos se calculan con fuentes recurrentes activas, normalizando pagos semimensuales y bimensuales al FX actual. Se asume que se mantienen, incluso fuentes cuya fecha inicial/futura aún debe verificarse. No son cobros confirmados ni recibidos. Si el aporte supera ingresos previstos menos presupuesto aparece un aviso; ese margen tampoco descuenta impuestos ni deuda.

No se asumen intereses, rendimientos, inflación ni incrementos de ingresos. No se convierte el ingreso sobrante en ahorro automáticamente. Si no existen aportes anteriores, el valor mensual comienza en cero y se puede ajustar. La gráfica es una simulación de continuidad, no una garantía de capacidad para ahorrar.

## Código y verificación

- `BudgetView.tsx`: búsqueda, filtros, tarjetas.
- `DatePicker.tsx`, `MonthPicker.tsx`: selectores propios accesibles por teclado y texto; validación final de fechas mediante Zod.
- `projections.ts`: cálculos puros; pruebas en `projections.test.ts`.
- `SavingsProjection.tsx`: horizonte por fecha/duración y gráfica SVG sin servicios externos.
- `db.ts`: migración atómica; prueba de preservación de IDs y ediciones posteriores.

Las nuevas propiedades opcionales `Entity.budgetGroup` y `Settings.budgetRevision` son compatibles con backups anteriores. La interfaz respeta los temas claro/oscuro y reducción de movimiento.
