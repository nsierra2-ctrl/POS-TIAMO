import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mesasTable = pgTable("mesas", {
  numero: text("numero").primaryKey(),
  nombre: text("nombre"),
  estado: text("estado", { enum: ["libre", "ocupada", "proceso"] })
    .notNull()
    .default("libre"),
  personas: integer("personas").notNull().default(0),
  actualizadoEn: timestamp("actualizado_en").defaultNow().notNull(),
});

export const insertMesaSchema = createInsertSchema(mesasTable);
export const updateMesaSchema = insertMesaSchema.partial().omit({ numero: true });

export type Mesa = typeof mesasTable.$inferSelect;
export type InsertMesa = z.infer<typeof insertMesaSchema>;
