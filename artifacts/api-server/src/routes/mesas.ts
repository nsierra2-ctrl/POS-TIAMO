import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, mesasTable, pedidosTable, updateMesaSchema } from "@workspace/db";
import { z } from "zod";
import { requireAuth, requireRol } from "../middlewares/auth";
import { broadcast } from "../lib/broadcast";

const router: IRouter = Router();

router.get("/mesas", requireAuth, async (req, res) => {
  try {
    const mesas = await db.select().from(mesasTable).orderBy(mesasTable.numero);
    res.json(mesas);
  } catch (e) {
    req.log.error(e, "Error al obtener mesas");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/mesas", requireAuth, requireRol("admin"), async (req, res) => {
  const schema = z.object({
    numero: z.string().min(1).max(20),
    nombre: z.string().optional(),
    zona: z.string().optional(),
    capacidad: z.number().int().min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const [mesa] = await db
      .insert(mesasTable)
      .values({
        numero: parsed.data.numero,
        nombre: parsed.data.nombre ?? null,
        estado: "libre",
        personas: 0,
      })
      .returning();

    broadcast("mesas_actualizadas", {});
    res.status(201).json(mesa);
  } catch (e: any) {
    if (e?.code === "23505") {
      res.status(409).json({ error: "Ya existe una mesa con ese número" });
      return;
    }
    req.log.error(e, "Error al crear mesa");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/mesas/:numero", requireAuth, async (req, res) => {
  const numero = req.params.numero as string;
  if (!numero) {
    res.status(400).json({ error: "Identificador de mesa inválido" });
    return;
  }

  const parsed = updateMesaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const [mesa] = await db
      .update(mesasTable)
      .set({ ...parsed.data, actualizadoEn: new Date() })
      .where(eq(mesasTable.numero, numero))
      .returning();

    if (!mesa) {
      res.status(404).json({ error: "Mesa no encontrada" });
      return;
    }

    broadcast("mesas_actualizadas", { numero });
    res.json(mesa);
  } catch (e) {
    req.log.error(e, "Error al actualizar mesa");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/mesas/:numero/solicitar-cuenta", requireAuth, async (req, res) => {
  const numero = req.params.numero as string;
  if (!numero) { res.status(400).json({ error: "Mesa inválida" }); return; }

  try {
    const [mesa] = await db
      .update(mesasTable)
      .set({ estado: "lista_cobro", actualizadoEn: new Date() })
      .where(eq(mesasTable.numero, numero))
      .returning();

    if (!mesa) { res.status(404).json({ error: "Mesa no encontrada" }); return; }

    broadcast("mesas_actualizadas", { numero });
    res.json({ ok: true, mesa });
  } catch (e) {
    req.log.error(e, "Error al solicitar cuenta");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/mesas/:numero/cerrar", requireAuth, async (req, res) => {
  const numero = req.params.numero as string;
  const schema = z.object({
    propina: z.number().int().min(0).optional(),
    propinaAceptada: z.number().int().min(0).optional(),
    propinaRechazada: z.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  try {
    const propina = parsed.data.propina ?? 0;
    const propinaAceptada = parsed.data.propinaAceptada ?? 0;
    const propinaRechazada = parsed.data.propinaRechazada ?? 0;

    // Buscar el último pedido cobrado de esta mesa
    const [ultimoPedido] = await db
      .select()
      .from(pedidosTable)
      .where(and(eq(pedidosTable.mesa, numero), eq(pedidosTable.estado, "cobrado")))
      .orderBy(desc(pedidosTable.cobradoEn))
      .limit(1);

    if (ultimoPedido) {
      const propinaNueva = (ultimoPedido.propina ?? 0) + propina;
      await db.update(pedidosTable)
        .set({
          propina: propinaNueva,
          ...(propinaAceptada > 0 ? { propinaAceptada } : {}),
          ...(propinaRechazada > 0 ? { propinaRechazada } : {}),
        })
        .where(eq(pedidosTable.id, ultimoPedido.id));
      broadcast("pedido_actualizado", { id: ultimoPedido.id });
    }

    // Mesa pasa a "finalizada" brevemente, luego a "libre"
    const [mesa] = await db
      .update(mesasTable)
      .set({ estado: "finalizada", personas: 0, actualizadoEn: new Date() })
      .where(eq(mesasTable.numero, numero))
      .returning();

    if (!mesa) { res.status(404).json({ error: "Mesa no encontrada" }); return; }

    // Después de un momento, liberar la mesa
    setTimeout(async () => {
      try {
        await db.update(mesasTable)
          .set({ estado: "libre", actualizadoEn: new Date() })
          .where(eq(mesasTable.numero, numero));
        broadcast("mesas_actualizadas", { numero });
      } catch {}
    }, 500);

    broadcast("mesas_actualizadas", { numero });
    res.json({ ok: true, mesa: { ...mesa, estado: "libre" } });
  } catch (e) {
    req.log.error(e, "Error al cerrar mesa");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/mesas/:numero", requireAuth, requireRol("admin"), async (req, res) => {
  const numero = req.params.numero as string;
  if (!numero) {
    res.status(400).json({ error: "Identificador de mesa inválido" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(mesasTable)
      .where(eq(mesasTable.numero, numero))
      .returning({ numero: mesasTable.numero });

    if (!deleted) {
      res.status(404).json({ error: "Mesa no encontrada" });
      return;
    }

    broadcast("mesas_actualizadas", {});
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, "Error al eliminar mesa");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
