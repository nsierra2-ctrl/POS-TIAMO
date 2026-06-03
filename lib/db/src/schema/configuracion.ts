import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configuracionTable = pgTable("configuracion", {
  id: serial("id").primaryKey(),
  nombreNegocio: text("nombre_negocio").notNull().default("TIAMO BURGER"),
  slogan: text("slogan").default("La hamburguesa que te enamora"),
  logoUrl: text("logo_url"),
  ruc: text("ruc").default(""),
  direccion: text("direccion").default(""),
  telefono: text("telefono").default(""),
  email: text("email").default(""),
  instagram: text("instagram").default(""),
  ciudad: text("ciudad").default(""),
  moneda: text("moneda").notNull().default("COP"),
  prefijoFactura: text("prefijo_factura").default("F"),
  mensajeFactura: text("mensaje_factura").default("¡Gracias por tu visita!"),
  configurado: boolean("configurado").notNull().default(false),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en").defaultNow().notNull(),
});

export const actualizarConfiguracionSchema = z.object({
  nombreNegocio: z.string().min(1).optional(),
  slogan: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  ruc: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  ciudad: z.string().optional(),
  moneda: z.string().optional(),
  prefijoFactura: z.string().optional(),
  mensajeFactura: z.string().optional(),
  configurado: z.boolean().optional(),
});

export type Configuracion = typeof configuracionTable.$inferSelect;
export const insertConfiguracionSchema = createInsertSchema(configuracionTable).omit({
  id: true,
  creadoEn: true,
  actualizadoEn: true,
});
