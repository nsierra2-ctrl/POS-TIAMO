import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usuariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "tiamo-burguer-secret-2024";

interface JWTPayload {
  usuarioId: number;
  rol: string;
}

export function signToken(usuarioId: number, rol: string): string {
  return jwt.sign({ usuarioId, rol }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  // Prefer explicit Bearer token over cookie (cookie may be stale in iframe previews)
  const token = bearerToken || req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie("token");
    res.status(401).json({ error: "Token inválido" });
    return;
  }

  try {
    const [usuario] = await db
      .select()
      .from(usuariosTable)
      .where(eq(usuariosTable.id, payload.usuarioId));

    if (!usuario || !usuario.activo) {
      res.clearCookie("token");
      res.status(401).json({ error: "Sesión inválida" });
      return;
    }

    (req as any).usuario = usuario;
    next();
  } catch (e) {
    req.log.error(e, "Error en middleware de auth");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export function requireRol(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;
    if (!usuario || !roles.includes(usuario.rol)) {
      res.status(403).json({ error: "No tienes permisos para esta acción" });
      return;
    }
    next();
  };
}
