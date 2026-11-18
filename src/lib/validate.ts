import { z } from "zod";

const emailSchema = z.email().max(200);
const passwordSchema = z.string().min(10).max(200);
const nameSchema = z.string().trim().min(2).max(80);

export function field(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseEmail(value: FormDataEntryValue | string | null | undefined) {
  const result = emailSchema.safeParse(field(value).toLowerCase());
  return result.success ? result.data : null;
}

export function parsePassword(value: FormDataEntryValue | string | null | undefined) {
  const raw = typeof value === "string" ? value : "";
  const result = passwordSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parsePersonName(value: FormDataEntryValue | string | null | undefined) {
  const result = nameSchema.safeParse(field(value));
  return result.success ? result.data : null;
}

export function parseDollarsToCents(value: string) {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > 100_000_000) return null;
  return cents;
}

export function parseOptionalDollars(value: string) {
  if (!value.trim()) return null;
  return parseDollarsToCents(value);
}

export function parseInteger(value: string, min: number, max: number) {
  if (!/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function parseUuid(value: FormDataEntryValue | string | null | undefined) {
  const text = field(value).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)
    ? text
    : null;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "creator";
}

export function parseTwitchLogin(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  let login = trimmed;
  if (trimmed.includes("twitch.tv")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      login = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return null;
    }
  }
  login = login.replace(/^@/, "");
  return /^[a-z0-9_]{3,25}$/.test(login) ? login : null;
}

export function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function cleanSearch(value: string) {
  return value.replace(/[%_]/g, "").trim().slice(0, 40);
}

export function parseCheckedTags(values: FormDataEntryValue[], allowed: readonly string[]) {
  const tags = values
    .filter((value): value is string => typeof value === "string")
    .filter((value) => allowed.includes(value));
  return [...new Set(tags)];
}
