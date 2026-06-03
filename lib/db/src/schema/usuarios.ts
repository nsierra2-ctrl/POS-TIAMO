import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usuariosTable = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  usuario: text("usuario").notNull().unique(),
  contrasenaHash: text("contrasena_hash").notNull(),
  rol: text("rol", { enum: ["admin", "mesero", "cocinero", "caja"] }).notNull().default("mesero"),
  activo: boolean("activo").notNull().default(true),
  fotoUrl: text("foto_url"),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const insertUsuarioSchema = createInsertSchema(usuariosTable).omit({
  id: true,
  creadoEn: true,
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  contrasena: z.string().min(4).optional(),
  rol: z.enum(["admin", "mesero", "cocinero", "caja"]).optional(),
  activo: z.boolean().optional(),
  fotoUrl: z.string().nullable().optional(),
});

export type Usuario = typeof usuariosTable.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
