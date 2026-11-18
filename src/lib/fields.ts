import { AppError } from "@/lib/errors";
import { field, parseDollarsToCents, parseInteger, parseUuid } from "@/lib/validate";

export { field };

export function uuidField(formData: FormData, name: string) {
  const id = parseUuid(formData.get(name));
  if (!id) throw new AppError("That record was not found.");
  return id;
}

export function intField(formData: FormData, name: string, min: number, max: number, label: string) {
  const value = parseInteger(field(formData.get(name)), min, max);
  if (value == null) throw new AppError(`${label} must be a whole number from ${min} to ${max}.`);
  return value;
}

export function centsField(formData: FormData, name: string, label: string) {
  const cents = parseDollarsToCents(field(formData.get(name)));
  if (cents == null) throw new AppError(`Enter a valid amount for ${label}.`);
  return cents;
}

export function optionalCents(formData: FormData, name: string, label: string) {
  const raw = field(formData.get(name));
  if (!raw) return null;
  const cents = parseDollarsToCents(raw);
  if (cents == null) throw new AppError(`Enter a valid amount for ${label}.`);
  return cents;
}

export function millisField(formData: FormData, name: string, label: string) {
  const raw = field(formData.get(name));
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) throw new AppError(`${label} must be a multiplier like 1.25.`);
  const millis = Math.round(Number(raw) * 1000);
  if (millis < 100 || millis > 10_000) throw new AppError(`${label} must be between 0.1 and 10.`);
  return millis;
}

export function bpsField(formData: FormData, name: string) {
  const raw = field(formData.get(name));
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new AppError("Commission must be a percent, like 20.");
  const bps = Math.round(Number(raw) * 100);
  if (bps < 0 || bps > 5000) throw new AppError("Commission must be between 0% and 50%.");
  return bps;
}

export function megabytesField(formData: FormData, name: string, label: string) {
  const raw = field(formData.get(name));
  if (!/^\d+(\.\d)?$/.test(raw)) throw new AppError(`${label} must be a size in megabytes.`);
  const bytes = Math.round(Number(raw) * 1024 * 1024);
  if (bytes < 100_000 || bytes > 100_000_000) throw new AppError(`${label} must be between 0.1 and 100 MB.`);
  return bytes;
}
