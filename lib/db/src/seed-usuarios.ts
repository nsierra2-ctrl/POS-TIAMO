import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { usuariosTable } from "./schema/usuarios";

const { Pool } = pg;

async function seedUsuarios() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const usuarios = [
    // ===== Admin =====
    { nombre: "Fernando", usuario: "fernando", contrasena: "0624", rol: "admin" as const },
    // ===== Meseros =====
    { nombre: "Ingrid", usuario: "ingrid", contrasena: "1234", rol: "mesero" as const },
    { nombre: "Zaira", usuario: "zaira", contrasena: "1234", rol: "mesero" as const },
    // ===== Caja =====
    { nombre: "Caja", usuario: "caja", contrasena: "caja", rol: "caja" as const },
    // ===== Cocina =====
    { nombre: "Cocina", usuario: "cocina", contrasena: "1234", rol: "cocinero" as const },
  ];

  console.log("Seeding usuarios...");

  for (const u of usuarios) {
    const existentes = await db
      .select({ id: usuariosTable.id })
      .from(usuariosTable)
      .where(eq(usuariosTable.usuario, u.usuario));

    if (existentes.length > 0) {
      console.log(`  ✓ Usuario '${u.usuario}' ya existe, actualizando contraseña`);
      const hash = await bcrypt.hash(u.contrasena, 10);
      await db.update(usuariosTable)
        .set({ contrasenaHash: hash, nombre: u.nombre, rol: u.rol, activo: true })
        .where(eq(usuariosTable.usuario, u.usuario));
      continue;
    }

    const hash = await bcrypt.hash(u.contrasena, 10);
    await db.insert(usuariosTable).values({
      nombre: u.nombre,
      usuario: u.usuario,
      contrasenaHash: hash,
      rol: u.rol,
      activo: true,
    });
    console.log(`  ✓ Usuario '${u.usuario}' creado (${u.rol})`);
  }

  console.log("Done.");
  await pool.end();
}

seedUsuarios().catch(console.error);
