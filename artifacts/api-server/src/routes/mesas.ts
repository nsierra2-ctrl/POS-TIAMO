import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, mesasTable, updateMesaSchema } from "@workspace/db";
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
