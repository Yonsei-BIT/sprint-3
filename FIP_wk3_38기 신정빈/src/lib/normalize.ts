export function normalizeFitScore(value: unknown, fallback: number) {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw)) return fallback;
  const scaled = raw > 0 && raw <= 10 ? raw * 10 : raw;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => toText(item)).filter(Boolean).join(", ") || fallback;
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${key.replace(/_/g, " ")}: ${toText(item)}`)
      .filter((item) => !item.endsWith(": "))
      .join(" / ") || fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function toTextArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    const items = value.map((item) => toText(item)).filter(Boolean);
    return items.length ? items : fallback;
  }
  const text = toText(value);
  return text ? [text] : fallback;
}
