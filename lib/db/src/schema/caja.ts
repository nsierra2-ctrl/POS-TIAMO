import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const cajaSesionesTable = pgTable("caja_sesiones", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull(),
  usuarioNombre: text("usuario_nombre").notNull(),
  aperturaEn: timestamp("apertura_en").defaultNow().notNull(),
  cierreEn: timestamp("cierre_en"),
  montoInicial: integer("monto_inicial").notNull().default(0),
  totalEfectivo: integer("total_efectivo").notNull().default(0),
  totalTransferencia: integer("total_transferencia").notNull().default(0),
  totalPropinas: integer("total_propinas").notNull().default(0),
  diferencia: integer("diferencia").notNull().default(0),
  estado: text("estado", { enum: ["abierta", "cerrada"] }).notNull().default("abierta"),
  notas: text("notas"),
});

export const abrirCajaSchema = z.object({
  montoInicial: z.number().int().min(0),
  notas: z.string().optional(),
});

export const cerrarCajaSchema = z.object({
  efectivoContado: z.number().int().min(0),
  notas: z.string().optional(),
});

// Tabla de historial de caja (persistente tras reset)
export const cajaHistorialTable = pgTable("caja_historial", {
  id: serial("id").primaryKey(),
  fecha: timestamp("fecha").defaultNow().notNull(),
  usuarioId: integer("usuario_id").notNull(),
  usuarioNombre: text("usuario_nombre").notNull(),
  montoInicial: integer("monto_inicial").notNull().default(0),
  totalEfectivo: integer("total_efectivo").notNull().default(0),
  totalTransferencia: integer("total_transferencia").notNull().default(0),
  totalPropinas: integer("total_propinas").notNull().default(0),
  totalVentas: integer("total_ventas").notNull().default(0),
  cantidadPedidos: integer("cantidad_pedidos").notNull().default(0),
  diferencia: integer("diferencia").notNull().default(0),
  notas: text("notas"),
  tipo: text("tipo", { enum: ["cierre", "reset"] }).notNull().default("cierre"),
});

export type CajaSesion = typeof cajaSesionesTable.$inferSelect;
export type CajaHistorial = typeof cajaHistorialTable.$inferSelect;
