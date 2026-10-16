export const kes = (n: number | null | undefined) =>
  n == null ? "—" : `KES ${Number(n).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export const nice = (s: string | null | undefined) => (s ? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "");

export const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
