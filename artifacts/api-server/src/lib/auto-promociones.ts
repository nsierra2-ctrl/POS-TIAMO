import { db, promocionesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { logger } from "./logger";

const PROMOS_DIARIAS = [
  {
    diasSemana: "1",
    nombre: "Lunes de Locura 🔥",
    descripcion: "15% de descuento en todas las hamburguesas del menú. Válido solo los lunes.",
    tipo: "descuento" as const,
    descuento: 15,
    tipoDescuento: "porcentaje" as const,
  },
  {
    diasSemana: "2",
    nombre: "2x1 Perros del Martes 🌭",
    descripcion: "Lleva dos perros calientes por el precio de uno. ¡Martes de ahorro!",
    tipo: "2x1" as const,
    descuento: 0,
    tipoDescuento: "porcentaje" as const,
  },
  {
    diasSemana: "3",
    nombre: "Miércoles de Bebidas 🥤",
    descripcion: "10% de descuento en todas las bebidas y granizadas. ¡Refréscate a mitad de semana!",
    tipo: "descuento" as const,
    descuento: 10,
    tipoDescuento: "porcentaje" as const,
  },
  {
    diasSemana: "4",
    nombre: "Happy Hour Jueves ⭐",
    descripcion: "20% de descuento en toda la carta de 3pm a 7pm. ¡Aprovecha el Happy Hour!",
    tipo: "happy_hour" as const,
    descuento: 20,
    tipoDescuento: "porcentaje" as const,
    horaInicio: "15:00",
    horaFin: "19:00",
  },
  {
    diasSemana: "5",
    nombre: "Viernes de Pizzetas 🍕",
    descripcion: "2x1 en todas las pizzetas del menú. ¡El mejor plan para empezar el fin de semana!",
    tipo: "2x1" as const,
    descuento: 0,
    tipoDescuento: "porcentaje" as const,
  },
  {
    diasSemana: "6",
    nombre: "Sábado Familiar 👨‍👩‍👧‍👦",
    descripcion: "Combo especial familiar: 2 hamburguesas dobles + 4 papas + 4 bebidas con 20% de descuento.",
    tipo: "combo" as const,
    descuento: 20,
    tipoDescuento: "porcentaje" as const,
  },
  {
    diasSemana: "0",
    nombre: "Domingo Feliz 😊",
    descripcion: "¡10% de descuento en todo el menú! El domingo merece celebrarse con la mejor comida.",
    tipo: "descuento" as const,
    descuento: 10,
    tipoDescuento: "porcentaje" as const,
  },
];

export async function seedAutoPromociones() {
  try {
    const hoy = new Date().getDay().toString();
    const promoHoy = PROMOS_DIARIAS.find((p) => p.diasSemana === hoy);
    if (!promoHoy) return;

    const existing = await db
      .select()
      .from(promocionesTable)
      .where(eq(promocionesTable.diasSemana, hoy));

    if (existing.length === 0) {
      await db.insert(promocionesTable).values({
        ...promoHoy,
        activo: true,
      });
      logger.info({ diasSemana: hoy, nombre: promoHoy.nombre }, "Promoción automática del día creada");
    } else {
      await db
        .update(promocionesTable)
        .set({ activo: true })
        .where(eq(promocionesTable.diasSemana, hoy));
      logger.info({ diasSemana: hoy }, "Promoción del día ya existe, activada");
    }
  } catch (e) {
    logger.error(e, "Error al seed auto-promociones");
  }
}
