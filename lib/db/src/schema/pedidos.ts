import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

export const itemPedidoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  emoji: z.string(),
  precio: z.number().int(),
  cantidad: z.number().int().min(1),
  observaciones: z.string().optional(),
});

export const pagoSchema = z.object({
  metodo: z.enum(["efectivo", "tarjeta", "transferencia"]),
  monto: z.number().int().min(0),
  tipoTarjeta: z.enum(["debito", "credito", "datafono", "daviplata", "nequi", "boton_bancolombia"]).optional(),
  banco: z.string().optional(),
  referencia: z.string().optional(),
  ultimos4: z.string().optional(),
});

export const historialEstadoSchema = z.object({
  estado: z.string(),
  usuarioId: z.number().int().optional(),
  usuarioNombre: z.string().optional(),
  ts: z.string(),
  nota: z.string().optional(),
});

export const pedidosTable = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  mesa: text("mesa").notNull(),
  items: jsonb("items").notNull(),
  estado: text("estado", { enum: ["nuevo", "preparando", "listo", "cobrado", "cancelado"] })
    .notNull()
    .default("nuevo"),
  total: integer("total").notNull(),
  notas: text("notas"),
  meseroId: integer("mesero_id"),
  metodoPago: text("metodo_pago", { enum: ["efectivo", "tarjeta", "transferencia", "mixto", "pendiente"] })
    .notNull()
    .default("pendiente"),
  pagos: jsonb("pagos").$type<Array<{ metodo: string; monto: number; tipoTarjeta?: string; banco?: string; referencia?: string; ultimos4?: string }>>().default([]),
  propina: integer("propina").notNull().default(0),
  propinaSugerida: integer("propina_sugerida").notNull().default(0),
  propinaAceptada: integer("propina_aceptada").notNull().default(0),
  propinaRechazada: integer("propina_rechazada").notNull().default(0),
  cambio: integer("cambio").notNull().default(0),
  numeroFactura: text("numero_factura"),
  cobradoEn: timestamp("cobrado_en"),
  cobradoPor: integer("cobrado_por"),
  historialEstados: jsonb("historial_estados")
    .$type<Array<{ estado: string; usuarioId?: number; usuarioNombre?: string; ts: string; nota?: string }>>()
    .default([]),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const updatePedidoSchema = z.object({
  estado: z.enum(["nuevo", "preparando", "listo", "cobrado", "cancelado"]).optional(),
  notas: z.string().optional(),
  nota: z.string().optional(),
});

export const cobrarPedidoSchema = z.object({
  pagos: z.array(pagoSchema).min(1),
  propina: z.number().int().min(0).optional(),
  propinaSugerida: z.number().int().min(0).optional(),
  propinaAceptada: z.number().int().min(0).optional(),
  nota: z.string().optional(),
});

export type Pedido = typeof pedidosTable.$inferSelect;
export type ItemPedido = z.infer<typeof itemPedidoSchema>;
export type Pago = z.infer<typeof pagoSchema>;
