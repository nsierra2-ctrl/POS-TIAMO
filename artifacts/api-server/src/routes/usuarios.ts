import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usuariosTable, actualizarUsuarioSchema } from "@workspace/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, requireRol } from "../middlewares/auth";

const router: IRouter = Router();

const crearUsuarioInputSchema = z.object({
  nombre: z.string().min(1),
  usuario: z.string().min(3),
  contrasena: z.string().min(4),
  rol: z.enum(["admin", "mesero", "cocinero", "caja"]),
});

function serializeUser(u: typeof usuariosTable.$inferSelect) {
  return {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol: u.rol,
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
    fotoUrl: u.fotoUrl ?? null,
  };
}

router.get("/usuarios", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const usuarios = await db
      .select()
      .from(usuariosTable)
      .orderBy(usuariosTable.creadoEn);

    res.json(usuarios.map(serializeUser));
  } catch (e) {
    req.log.error(e, "Error al obtener usuarios");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/usuarios", requireAuth, requireRol("admin"), async (req, res) => {
  const parsed = crearUsuarioInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const existente = await db
      .select({ id: usuariosTable.id })
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, parsed.data.usuario));

    if (existente.length > 0) {
      res.status(409).json({ error: "El nombre de usuario ya existe" });
      return;
    }

    const hash = await bcrypt.hash(parsed.data.contrasena, 10);
    const [usuario] = await db
      .insert(usuariosTable)
      .values({
        nombre: parsed.data.nombre,
        usuario: parsed.data.usuario,
        contrasenaHash: hash,
        rol: parsed.data.rol,
        activo: true,
      })
      .returning();

    res.status(201).json(serializeUser(usuario));
  } catch (e) {
    req.log.error(e, "Error al crear usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/usuarios/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = actualizarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const updates: Record<string, unknown> = {};
    if (parsed.data.nombre !== undefined) updates.nombre = parsed.data.nombre;
    if (parsed.data.rol !== undefined) updates.rol = parsed.data.rol;
    if (parsed.data.activo !== undefined) updates.activo = parsed.data.activo;
    if (parsed.data.fotoUrl !== undefined) updates.fotoUrl = parsed.data.fotoUrl;
    if (parsed.data.contrasena !== undefined) {
      updates.contrasenaHash = await bcrypt.hash(parsed.data.contrasena, 10);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No hay datos para actualizar" });
      return;
    }

    const [usuario] = await db
      .update(usuariosTable)
      .set(updates as any)
      .where(eq(usuariosTable.id, id))
      .returning();

    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json(serializeUser(usuario));
  } catch (e) {
    req.log.error(e, "Error al actualizar usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/usuarios/:id/foto", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const currentUser = (req as any).usuario;

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  if (currentUser.id !== id && currentUser.rol !== "admin") {
    res.status(403).json({ error: "Sin permisos" });
    return;
  }

  const { fotoUrl } = req.body;
  if (fotoUrl !== null && typeof fotoUrl !== "string") {
    res.status(400).json({ error: "fotoUrl inválida" });
    return;
  }

  try {
    const [usuario] = await db
      .update(usuariosTable)
      .set({ fotoUrl: fotoUrl ?? null })
      .where(eq(usuariosTable.id, id))
      .returning();

    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json(serializeUser(usuario));
  } catch (e) {
    req.log.error(e, "Error al actualizar foto");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/usuarios/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const currentUser = (req as any).usuario;

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  if (id === currentUser.id) {
    res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    return;
  }

  try {
    const [usuario] = await db
      .delete(usuariosTable)
      .where(eq(usuariosTable.id, id))
      .returning({ id: usuariosTable.id });

    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, "Error al eliminar usuario");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
