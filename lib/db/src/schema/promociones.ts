import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const promocionesTable = pgTable("promociones", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  tipo: text("tipo").notNull().default("descuento"),
  descuento: integer("descuento"),
  tipoDescuento: text("tipo_descuento").notNull().default("porcentaje"),
  activo: boolean("activo").notNull().default(true),
  diasSemana: text("dias_semana"),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  imagenUrl: text("imagen_url"),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export type Promocion = typeof promocionesTable.$inferSelect;
