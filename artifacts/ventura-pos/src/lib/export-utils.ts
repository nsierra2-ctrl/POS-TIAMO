// Export utilities: CSV download + WhatsApp sharing
// WhatsApp config persisted in localStorage as "tiamo:wa-number"

export type Row = Record<string, string | number | null | undefined>;

export function getWhatsAppNumber(): string {
  try {
    return localStorage.getItem("tiamo:wa-number") ?? "";
  } catch {
    return "";
  }
}

export function setWhatsAppNumber(num: string): void {
  try {
    localStorage.setItem("tiamo:wa-number", num);
  } catch {}
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escapeCsv(r[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, rows: Row[]): void {
  const csv = rowsToCsv(rows);
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizePhone(num: string): string {
  return num.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function openWhatsApp(message: string, phoneOverride?: string): void {
  const phone = sanitizePhone(phoneOverride ?? getWhatsAppNumber());
  const text = encodeURIComponent(message);
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  const url = `${base}?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// Build a friendly markdown-ish summary for WhatsApp
export function rowsToWhatsAppText(
  title: string,
  rows: Row[],
  options?: { maxRows?: number; subtitle?: string },
): string {
  const max = options?.maxRows ?? 30;
  const lines: string[] = [];
  lines.push(`*🍔 TIAMO BURGER · ${title}*`);
  if (options?.subtitle) lines.push(`_${options.subtitle}_`);
  lines.push(`📅 ${new Date().toLocaleString("es-CO")}`);
  lines.push(`📊 Total registros: *${rows.length}*`);
  lines.push("");
  lines.push("─".repeat(28));
  lines.push("");

  const slice = rows.slice(0, max);
  for (const r of slice) {
    const block = Object.entries(r)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `• *${k}*: ${v}`)
      .join("\n");
    lines.push(block);
    lines.push("");
  }
  if (rows.length > max) {
    lines.push(`_...y ${rows.length - max} registros más (descarga el CSV completo)_`);
  }
  lines.push("─".repeat(28));
  lines.push("_Enviado desde TIAMO BURGER POS_");
  return lines.join("\n");
}
