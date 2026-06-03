import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const productosTable = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  precio: integer("precio").notNull(),
  emoji: text("emoji").notNull().default("🍔"),
  imagenUrl: text("imagen_url"),
  categoria: text("categoria").notNull(),
  disponible: boolean("disponible").notNull().default(true),
  destacado: boolean("destacado").notNull().default(false),
  posicion: integer("posicion").notNull().default(0),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const insertProductoSchema = createInsertSchema(productosTable).omit({
  id: true,
  creadoEn: true,
});

export const actualizarProductoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  precio: z.number().int().min(0).optional(),
  emoji: z.string().optional(),
  imagenUrl: z.string().url().nullable().optional(),
  categoria: z.string().optional(),
  disponible: z.boolean().optional(),
  destacado: z.boolean().optional(),
  posicion: z.number().int().optional(),
});

export type Producto = typeof productosTable.$inferSelect;
export type InsertProducto = z.infer<typeof insertProductoSchema>;
