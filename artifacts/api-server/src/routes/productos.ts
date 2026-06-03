import { Router, type IRouter } from "express";
import { db, productosTable } from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import { requireAuth, requireRol } from "../middlewares/auth";
import { broadcast } from "../lib/broadcast";
import { insertProductoSchema, actualizarProductoSchema } from "@workspace/db";

const router: IRouter = Router();

router.get("/productos", async (req, res) => {
  try {
    const { categoria, soloDisponibles } = req.query as Record<string, string>;

    const conditions = [];
    if (categoria) {
      conditions.push(eq(productosTable.categoria, categoria));
    }
    if (soloDisponibles === "true") {
      conditions.push(eq(productosTable.disponible, true));
    }

    const productos = await db
      .select()
      .from(productosTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(productosTable.posicion), asc(productosTable.nombre));

    res.json(
      productos.map((p) => ({
        ...p,
        creadoEn: p.creadoEn.toISOString(),
      })),
    );
  } catch (e) {
    req.log.error(e, "Error al obtener productos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/productos", requireAuth, requireRol("admin"), async (req, res) => {
  const parsed = insertProductoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }

  try {
    const [producto] = await db.insert(productosTable).values(parsed.data).returning();
    broadcast("productos_actualizados", { tipo: "creado", id: producto.id });
    res.status(201).json({ ...producto, creadoEn: producto.creadoEn.toISOString() });
  } catch (e) {
    req.log.error(e, "Error al crear producto");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/productos/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = actualizarProductoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }

  try {
    const [producto] = await db
      .update(productosTable)
      .set(parsed.data)
      .where(eq(productosTable.id, id))
      .returning();

    if (!producto) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    broadcast("productos_actualizados", { tipo: "actualizado", id: producto.id });
    res.json({ ...producto, creadoEn: producto.creadoEn.toISOString() });
  } catch (e) {
    req.log.error(e, "Error al actualizar producto");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/productos/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(productosTable)
      .where(eq(productosTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    broadcast("productos_actualizados", { tipo: "eliminado", id });
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, "Error al eliminar producto");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
