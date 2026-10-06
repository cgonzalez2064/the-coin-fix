# Categorías generales, Hogar, temas y cuotas

## Dos niveles

Categorías generales iniciales: Hogar, Alimentación, Servicios, Renta, Transporte, Salud, Familia, Mascota, Ocio, Personal y Otros. Los rubros existentes permanecen como categorías específicas y conservan sus IDs, importes y movimientos. Ejemplos: Supermercado/Comidas fuera → Alimentación; electricidad/internet/móvil → Servicios; alquiler → Renta; comida/premios y veterinario → Mascota; apoyo familiar y universidad → Familia. Renta familiar se clasifica como Familia, separada del alquiler propio.

En Presupuesto puedes buscar por nombre de rubro o grupo, filtrar una categoría general y combinarlo con Esenciales/Variables/Provisiones. Editar un rubro permite cambiar su categoría general. La gráfica desplegable muestra distribución de límites previstos y proporciones del total, junto al consumo real.

«Organizar categorías generales y resumen de Hogar» está en Presupuesto y Hogar. Agrega o renombra un grupo, o quítalo para reasignar sus rubros a Otros. Los movimientos no se borran. Otros es el grupo de respaldo y no se quita ni renombra. La selección por casillas decide qué áreas aparecen en Hogar. Máximo 30 grupos, nombres únicos sin distinguir mayúsculas. Los rubros específicos se agregan/editan con los controles existentes; eliminar un rubro sigue las protecciones de referencias y confirmación existentes.

## Estadísticas

Dashboard: Hogar, Mascota, Alimentación, Familia y ahorro del mes. Hogar suma áreas seleccionadas (inicialmente Hogar, Renta, Servicios, Alimentación). Las tarjetas son vistas superpuestas: Alimentación puede formar parte de Hogar, así que no deben sumarse. Los gastos usan tipo expense, mes seleccionado y fechas hasta hoy. No se usa la participación del miembro para disminuir gastos de cuentas. Ahorro usa aportes a metas de ahorro/emergencia; excluye inversión. Sin movimientos registrados muestra cero.

Hogar: total y desglose con consumo, presupuesto y porcentaje utilizado de las áreas seleccionadas. Los integrantes y aportes previstos permanecen separados. La selección no crea gastos ni ingresos.

## Cuotas de deuda

Editar una deuda → desplegar «Dividir en cuotas mensuales (opcional)» → activar → definir plazos restantes, monto por cuota (moneda de la deuda) y próxima fecha. La sugerencia inicial divide el monto base entre 12; es editable y no confirma términos del acreedor.

Cada tarjeta configurada muestra cuotas mensuales, gráfica de saldo y tabla de hasta las primeras doce fechas/pagos/saldos. El último pago puede ser parcial. Un día 31 se limita al último día de febrero/abril, pero vuelve al día 31 donde existe. Si el importe mensual por los plazos definidos no cubre capital, aparece el faltante.

Es un escenario de reducción de capital sin intereses nuevos. APR desconocido continúa desconocido; no se sustituye el simulador de deuda. No crea pagos ni eventos en Calendario automáticamente. Registrar pago propone el importe de la cuota, limitado al saldo actual, con fecha de hoy y moneda de la deuda; puedes editarlo. Registra pagos reales manualmente y actualiza plazos restantes y próxima fecha; los pagos reducen el saldo del escenario. La gráfica general de deudas compara saldos restantes, porcentajes y capital registrado pagado.

## Cuatro temas

- Obsidian: negro real y acento verde.
- Pearl: claro, neutro y acento verde.
- Midnight: azul noche y acento azul.
- Sand: crema cálido y acento tierra.

Ajustes → Tema, o botón de tema para recorrer los cuatro. Sistema conserva selección automática claro/oscuro. Se guardan por perfil local. Gráficas, formularios y calendario siguen las variables del tema; reducción de movimiento permanece activa.

## Seguridad y validación

Login inicial: email y contraseña únicamente. CAPTCHA y MFA son etapas posteriores; MFA solo para cuentas que lo hayan activado. No existe sesión autenticada hasta completar las verificaciones. Consulta AUTH_AND_SETUP.md para tickets, límites y pendientes de producción.

Pruebas de clasificación, consumos por fecha, cuotas/fechas/último pago, persistencia, temas y validación en budgetAreas.test.ts/db.test.ts. Pruebas de acceso comprueban ausencia de cookie antes de CAPTCHA/MFA, reutilización rechazada y expiración. Las gráficas no fabrican consumos ni operaciones bancarias.

## Gestión centralizada de categorías
En Presupuesto, el selector **Mi presupuesto / Gestión de categorías** separa el seguimiento de consumos de la administración. En Gestión de categorías puedes crear, editar y eliminar rubros, organizar grupos generales y seleccionar las áreas del resumen de Hogar. Hogar ofrece un acceso directo al mismo apartado. La vista principal permite editar límites sin mostrar controles de eliminación. Las protecciones para categorías vinculadas a movimientos se mantienen.
