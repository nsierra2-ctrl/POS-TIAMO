import { Router, type IRouter } from "express";
import { sql, gte } from "drizzle-orm";
import { db, pedidosTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/display/pedidos", async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pedidos = await db
      .select({
        id: pedidosTable.id,
        mesa: pedidosTable.mesa,
        estado: pedidosTable.estado,
        creadoEn: pedidosTable.creadoEn,
      })
      .from(pedidosTable)
      .where(gte(pedidosTable.creadoEn, hoy))
      .orderBy(pedidosTable.id);

    res.json(
      pedidos.map((p) => ({
        ...p,
        creadoEn: p.creadoEn.toISOString(),
      })),
    );
  } catch (e) {
    req.log.error(e, "Error en display/pedidos");
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
