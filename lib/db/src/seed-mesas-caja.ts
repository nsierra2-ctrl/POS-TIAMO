import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { mesasTable } from "./schema/mesas";
import { cajaSesionesTable } from "./schema/caja";
import { pedidosTable } from "./schema/pedidos";

const { Pool } = pg;

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // ===== SEMBRAR MESAS =====
  console.log("🪑 Sembrando mesas...");
  const mesasExistentes = await db.select({ numero: mesasTable.numero }).from(mesasTable);
  const mesasNumeros = new Set(mesasExistentes.map((m) => m.numero));

  const mesasNombres = [
    { numero: "01", nombre: "Terraza 1" },
    { numero: "02", nombre: "Terraza 2" },
    { numero: "03", nombre: "Salón 1" },
    { numero: "04", nombre: "Salón 2" },
    { numero: "05", nombre: "Bar A" },
    { numero: "06", nombre: "Bar B" },
    { numero: "07", nombre: "VIP 1" },
    { numero: "08", nombre: "VIP 2" },
    { numero: "09", nombre: "Jardín 1" },
    { numero: "10", nombre: "Jardín 2" },
    { numero: "T1", nombre: "Terraza Principal" },
    { numero: "B1", nombre: "Bar Central" },
  ];

  for (const m of mesasNombres) {
    if (!mesasNumeros.has(m.numero)) {
      await db.insert(mesasTable).values({
        numero: m.numero,
        nombre: m.nombre,
        estado: m.numero === "03" || m.numero === "07" ? "ocupada" : m.numero === "05" ? "en_pago" : "libre",
        personas: m.numero === "03" ? 4 : m.numero === "07" ? 2 : m.numero === "05" ? 6 : 0,
      });
      console.log(`  ✓ Mesa ${m.numero} creada`);
    } else {
      console.log(`  ✓ Mesa ${m.numero} ya existe`);
    }
  }

  // ===== SEMBRAR SESION CAJA =====
  console.log("💰 Sembrando sesión de caja...");
  const sesiones = await db
    .select({ id: cajaSesionesTable.id })
    .from(cajaSesionesTable)
    .where(eq(cajaSesionesTable.estado, "abierta"));

  if (sesiones.length === 0) {
    await db.insert(cajaSesionesTable).values({
      usuarioId: 2,
      usuarioNombre: "Administrador Demo",
      montoInicial: 200000,
      totalEfectivo: 345000,
      totalTransferencia: 180000,
      totalPropinas: 25000,
      diferencia: 0,
      estado: "abierta",
      notas: "Fondo inicial de $200,000",
    });
    console.log("  ✓ Sesión de caja abierta creada");
  } else {
    console.log("  ✓ Ya hay sesión abierta");
  }

  // ===== SEMBRAR PEDIDOS DEMO =====
  console.log("📦 Sembrando pedidos de demo...");
  const pedidosExistentes = await db.select({ id: pedidosTable.id }).from(pedidosTable);

  if (pedidosExistentes.length === 0) {
    const pedidosDemo = [
      {
        mesa: "03",
        items: [{ id: "1", nombre: "Tiamo Classic", emoji: "🍔", precio: 18000, cantidad: 2, observaciones: "" }, { id: "8", nombre: "Papas Premium", emoji: "🍟", precio: 9000, cantidad: 1 }],
        estado: "nuevo" as const,
        total: 45000,
        meseroId: 4,
        metodoPago: "pendiente" as const,
        pagos: [],
        propina: 0,
      },
      {
        mesa: "07",
        items: [{ id: "2", nombre: "Double Tiamo", emoji: "🍔", precio: 24000, cantidad: 1 }],
        estado: "preparando" as const,
        total: 24000,
        meseroId: 5,
        metodoPago: "pendiente" as const,
        pagos: [],
        propina: 0,
      },
      {
        mesa: "05",
        items: [
          { id: "3", nombre: "BBQ Bacon", emoji: "🥓", precio: 22000, cantidad: 3, observaciones: "Sin cebolla" },
          { id: "10", nombre: "Malteada Vainilla", emoji: "🥤", precio: 14000, cantidad: 2 },
        ],
        estado: "listo" as const,
        total: 94000,
        meseroId: 4,
        metodoPago: "efectivo" as const,
        pagos: [{ metodo: "efectivo", monto: 94000 }],
        propina: 3000,
      },
      {
        mesa: "01",
        items: [{ id: "1", nombre: "Tiamo Classic", emoji: "🍔", precio: 18000, cantidad: 1 }, { id: "8", nombre: "Papas Premium", emoji: "🍟", precio: 9000, cantidad: 1 }],
        estado: "cobrado" as const,
        total: 27000,
        meseroId: 4,
        metodoPago: "efectivo" as const,
        pagos: [{ metodo: "efectivo", monto: 27000 }],
        propina: 2000,
      },
      {
        mesa: 2,
        items: [{ id: "2", nombre: "Double Tiamo", emoji: "🍔", precio: 24000, cantidad: 1 }, { id: "9", nombre: "Nuggets x8", emoji: "🍗", precio: 12000, cantidad: 1 }],
        estado: "cobrado" as const,
        total: 36000,
        meseroId: 5,
        metodoPago: "mixto" as const,
        pagos: [{ metodo: "efectivo", monto: 16000 }, { metodo: "transferencia", monto: 20000 }],
        propina: 1000,
      },
    ];

    for (const p of pedidosDemo) {
      await db.insert(pedidosTable).values(p as any);
    }
    console.log(`  ✓ ${pedidosDemo.length} pedidos de demo creados`);
  } else {
    console.log(`  ✓ Ya hay ${pedidosExistentes.length} pedidos existentes`);
  }

  console.log("Done.");
  await pool.end();
}

seed().catch(console.error);
