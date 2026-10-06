# Categorías y grupos

En Presupuesto hay tres submenús: **Gastos**, **Editar categorías** y **Editar grupos**. Gastos muestra primero los límites y consumos en tarjetas, después las gráficas de distribución prevista y consumo real, y al final el acceso a los grupos del resumen de Hogar. El encabezado es compacto.

## Editar categorías

Busca una categoría, pulsa Editar y cambia su nombre, grupo general, tipo (esencial, variable o provisional) y estado. Guarda para aplicar o cancela para conservar los datos. Nueva categoría abre el formulario de creación con su límite mensual. Los límites siguen siendo editables desde las tarjetas.

Deshabilitar conserva ID, límite, notas y movimientos históricos. La categoría desaparece de las tarjetas activas y del selector de nuevas compras; su límite deja de sumarse al presupuesto, las proyecciones y el reparto recomendado. Los gastos ya registrados siguen contando dentro de su grupo. Volver a habilitar restaura el límite. Deshabilitar no cancela plantillas recurrentes: páusalas en Recurrentes si corresponde. Eliminar mantiene la protección contra referencias existentes.

## Editar grupos

Abre Organizar categorías generales y resumen de Hogar. Puedes crear o renombrar grupos, elegir cuáles integran Hogar y quitar grupos. Renombrar conserva las relaciones mediante una transacción de IndexedDB; quitar reasigna los rubros a Otros sin borrar sus gastos. Otros se conserva como destino de respaldo. Los tipos esencial/variable/provisional son clasificaciones fijas; los grupos generales como Hogar o Familia son personalizables.

## Mantenimiento

CategoryManager.tsx contiene el editor compacto. AreaManager.tsx administra grupos. budgetAreas.ts conserva el historial de categorías inactivas pero excluye sus límites; projections.ts y cashflow.ts respetan el mismo estado. Se reutiliza Entity.active, sin migración ni campo nuevo. El servidor mantiene sus validaciones y permisos: solamente administradores pueden cambiar categorías y grupos compartidos.
