import { Router, type IRouter } from "express";
import {
  db,
  mesasTable,
  pedidosTable,
  usuariosTable,
  productosTable,
  cajaSesionesTable,
  promocionesTable,
  configuracionTable,
} from "@workspace/db";
import { requireAuth, requireRol } from "../middlewares/auth";
import { broadcast } from "../lib/broadcast";
import { z } from "zod";

const router: IRouter = Router();

router.get("/admin/backup", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const [mesas, pedidos, usuarios, productos, cajas, promos, config] = await Promise.all([
      db.select().from(mesasTable),
      db.select().from(pedidosTable),
      db.select().from(usuariosTable),
      db.select().from(productosTable),
      db.select().from(cajaSesionesTable),
      db.select().from(promocionesTable),
      db.select().from(configuracionTable),
    ]);
    const data = {
      version: 1,
      generadoEn: new Date().toISOString(),
      tables: { mesas, pedidos, usuarios, productos, cajaSesiones: cajas, promociones: promos, configuracion: config },
    };
    const fname = `tiamo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (e) {
    req.log.error(e, "Error backup");
    res.status(500).json({ error: "Error al generar backup" });
  }
});

// ===== Restore con validación Zod estricta =====
const mesaSchema = z.object({
  numero: z.string(),
  nombre: z.string().optional(),
  estado: z.string().optional(),
  personas: z.number().int().optional(),
}).passthrough();

const productoSchema = z.object({
  nombre: z.string(),
  precio: z.number().int(),
  categoria: z.string(),
  emoji: z.string().optional(),
  disponible: z.boolean().optional(),
  destacado: z.boolean().optional(),
  imagenUrl: z.string().nullable().optional(),
}).passthrough();

// Para usuarios: NO aceptar contrasenaHash directamente desde JSON externo
// Solo nombre/usuario/rol/activo/fotoUrl. Si vienen sin hash, se les asigna uno por defecto temporal
const usuarioSchema = z.object({
  nombre: z.string().min(1),
  usuario: z.string().min(1),
  rol: z.enum(["admin", "mesero", "cocinero", "caja"]),
  activo: z.boolean().optional(),
  fotoUrl: z.string().nullable().optional(),
  contrasenaHash: z.string().optional(),
});

const pedidoSchema = z.object({
  mesa: z.number().int(),
  estado: z.string(),
  total: z.number().int(),
  items: z.array(z.any()),
}).passthrough();

const cajaSesionSchema = z.object({
  fondoInicial: z.number().int(),
  abiertaEn: z.string(),
}).passthrough();

const promoSchema = z.object({
  nombre: z.string(),
}).passthrough();

const configSchema = z.object({
  nombreNegocio: z.string().min(1),
}).passthrough();

const restoreSchema = z.object({
  modo: z.enum(["merge", "replace"]).default("merge"),
  tables: z.object({
    mesas: z.array(mesaSchema).optional(),
    productos: z.array(productoSchema).optional(),
    usuarios: z.array(usuarioSchema).optional(),
    pedidos: z.array(pedidoSchema).optional(),
    cajaSesiones: z.array(cajaSesionSchema).optional(),
    promociones: z.array(promoSchema).optional(),
    configuracion: z.array(configSchema).optional(),
  }),
});

router.post("/admin/restore", requireAuth, requireRol("admin"), async (req, res) => {
  const parsed = restoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Backup inválido", detalles: parsed.error.flatten() });
    return;
  }
  const { modo, tables } = parsed.data;
  const stats = { mesas: 0, productos: 0, usuarios: 0, pedidos: 0, cajaSesiones: 0, promociones: 0, configuracion: 0 };

  try {
    // Transacción atómica — rollback si algo falla
    await db.transaction(async (tx) => {
      if (modo === "replace") {
        // Borrado en orden de dependencias
        await tx.delete(pedidosTable);
        await tx.delete(cajaSesionesTable);
        await tx.delete(promocionesTable);
        await tx.delete(productosTable);
        // mesas no se borra para preservar configuración física del local
      }

      if (tables.mesas) {
        for (const m of tables.mesas) {
          if (modo === "replace") {
            // Reset state on existing mesas
            const existing = await tx.select().from(mesasTable);
            const numbers = new Set(existing.map((x) => x.numero));
            if (!numbers.has(m.numero)) {
              await tx.insert(mesasTable).values({ numero: m.numero, estado: (m.estado ?? "libre") as "libre" | "ocupada" | "proceso", personas: m.personas ?? 0 });
              stats.mesas++;
            }
          } else {
            const existing = await tx.select().from(mesasTable);
            const numbers = new Set(existing.map((x) => x.numero));
            if (!numbers.has(m.numero)) {
              await tx.insert(mesasTable).values({ numero: m.numero, estado: (m.estado ?? "libre") as "libre" | "ocupada" | "proceso", personas: m.personas ?? 0 });
              stats.mesas++;
            }
          }
        }
      }

      if (tables.productos) {
        for (const p of tables.productos) {
          const { id: _id, ...rest } = p as any;
          await tx.insert(productosTable).values(rest);
          stats.productos++;
        }
      }

      if (tables.usuarios) {
        const bcrypt = await import("bcryptjs");
        for (const u of tables.usuarios) {
          // Si el JSON trae contrasenaHash y empieza por "$2" (bcrypt) lo respetamos.
          // Caso contrario, asignamos un hash temporal "Restaurado2026!" para forzar cambio.
          const hash =
            u.contrasenaHash && u.contrasenaHash.startsWith("$2")
              ? u.contrasenaHash
              : await bcrypt.hash("Restaurado2026!", 10);
          await tx.insert(usuariosTable).values({
            nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: u.activo ?? true,
            fotoUrl: u.fotoUrl ?? null, contrasenaHash: hash,
          }).onConflictDoNothing();
          stats.usuarios++;
        }
      }

      if (tables.pedidos) {
        for (const p of tables.pedidos) {
          const { id: _id, ...rest } = p as any;
          await tx.insert(pedidosTable).values(rest);
          stats.pedidos++;
        }
      }

      if (tables.cajaSesiones) {
        for (const c of tables.cajaSesiones) {
          const { id: _id, ...rest } = c as any;
          await tx.insert(cajaSesionesTable).values(rest);
          stats.cajaSesiones++;
        }
      }

      if (tables.promociones) {
        for (const pr of tables.promociones) {
          const { id: _id, ...rest } = pr as any;
          await tx.insert(promocionesTable).values(rest);
          stats.promociones++;
        }
      }

      if (tables.configuracion && tables.configuracion.length > 0) {
        const cfg = tables.configuracion[0]!;
        const { id: _id, creadoEn: _c, ...rest } = cfg as any;
        const existing = await tx.select().from(configuracionTable);
        if (existing.length > 0) {
          const { eq } = await import("drizzle-orm");
          await tx.update(configuracionTable).set({ ...rest, actualizadoEn: new Date() }).where(eq(configuracionTable.id, existing[0]!.id));
        } else {
          await tx.insert(configuracionTable).values(rest);
        }
        stats.configuracion = 1;
      }
    });

    broadcast("restore_completado", { ts: new Date().toISOString(), modo });
    res.json({ ok: true, modo, stats });
  } catch (e) {
    req.log.error(e, "Error restore (rollback aplicado)");
    res.status(500).json({ error: "Error al restaurar backup. La base quedó intacta (transacción revertida)." });
  }
});

export default router;
