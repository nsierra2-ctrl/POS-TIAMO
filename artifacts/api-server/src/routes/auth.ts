import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usuariosTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { requireAuth, signToken } from "../middlewares/auth";

const router: IRouter = Router();

const isDev = process.env.NODE_ENV === "development";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: !isDev,
  sameSite: isDev ? "lax" as const : "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function serializeUser(user: typeof usuariosTable.$inferSelect) {
  return {
    id: user.id,
    nombre: user.nombre,
    usuario: user.usuario,
    rol: user.rol,
    activo: user.activo,
    creadoEn: user.creadoEn.toISOString(),
    fotoUrl: user.fotoUrl ?? null,
  };
}

router.post("/auth/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, usuario));

    if (!user || !user.activo) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const passwordValida = await bcrypt.compare(contrasena, user.contrasenaHash);
    if (!passwordValida) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const token = signToken(user.id, user.rol);
    res.cookie("token", token, COOKIE_OPTS);
    // Clear any potentially stale cookie before setting the new one
    res.clearCookie("token", { path: "/", domain: undefined });
    res.cookie("token", token, COOKIE_OPTS);
    res.json({ ...serializeUser(user), token });
  } catch (e) {
    req.log.error(e, "Error en login");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTS);
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const usuario = (req as any).usuario;
  res.json(serializeUser(usuario));
});

export default router;
