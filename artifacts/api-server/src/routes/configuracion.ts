import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, configuracionTable, actualizarConfiguracionSchema } from "@workspace/db";
import { requireAuth, requireRol } from "../middlewares/auth";
import { broadcast } from "../lib/broadcast";

const router: IRouter = Router();

async function asegurarConfiguracion() {
  const existentes = await db.select().from(configuracionTable).limit(1);
  if (existentes.length === 0) {
    const [creada] = await db.insert(configuracionTable).values({}).returning();
    return creada!;
  }
  return existentes[0]!;
}

router.get("/configuracion", requireAuth, async (_req, res) => {
  try {
    const cfg = await asegurarConfiguracion();
    res.json(cfg);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener configuración" });
  }
});

router.put("/configuracion", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const parsed = actualizarConfiguracionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.flatten() });
      return;
    }
    const cfg = await asegurarConfiguracion();
    const [actualizada] = await db
      .update(configuracionTable)
      .set({ ...parsed.data, actualizadoEn: new Date() })
      .where(eq(configuracionTable.id, cfg.id))
      .returning();
    broadcast("configuracion_actualizada", { ts: new Date().toISOString() });
    res.json(actualizada);
  } catch (e) {
    req.log.error(e, "Error al actualizar configuración");
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
});

export default router;
