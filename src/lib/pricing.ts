import {
  MAX_CAMPAIGN_DAYS,
  type PlacementSize,
  type Rotation,
} from "@/lib/constants";

export type PricingTier = {
  name: string;
  minCcv: number;
  maxCcv: number | null;
  dailyRateCents: number;
  active: boolean;
};

export type PricingSettings = {
  commissionBps: number;
  exclusivityMillis: number;
  rotationStandardMillis: number;
  rotationHighMillis: number;
  rotationMaxMillis: number;
  sizeSmallMillis: number;
  sizeMediumMillis: number;
  sizeLargeMillis: number;
};

export type QuoteInput = {
  ccv: number;
  days: number;
  askingDailyCents: number | null;
  floorDailyCents: number | null;
  size: PlacementSize;
  rotation: Rotation;
  exclusivity: boolean;
  tiers: PricingTier[];
  settings: PricingSettings;
};

export type Quote = {
  tierName: string;
  tierDailyCents: number;
  askingDailyCents: number | null;
  floorDailyCents: number;
  baseDailyCents: number;
  days: number;
  sizeMillis: number;
  rotationMillis: number;
  exclusivityMillis: number;
  grossCents: number;
  commissionCents: number;
  netCents: number;
};

export function inclusiveDays(start: string, end: string) {
  if (!isIsoDate(start) || !isIsoDate(end)) return null;
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  const days = Math.round((b - a) / 86_400_000) + 1;
  if (days < 1 || days > MAX_CAMPAIGN_DAYS) return null;
  return days;
}

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function tierForCcv(ccv: number, tiers: PricingTier[]) {
  return (
    tiers
      .filter((tier) => tier.active)
      .sort((a, b) => a.minCcv - b.minCcv)
      .find((tier) => ccv >= tier.minCcv && (tier.maxCcv == null || ccv <= tier.maxCcv)) ?? null
  );
}

export function sizeMillis(settings: PricingSettings, size: PlacementSize) {
  if (size === "small") return settings.sizeSmallMillis;
  if (size === "large") return settings.sizeLargeMillis;
  return settings.sizeMediumMillis;
}

export function rotationMillis(settings: PricingSettings, rotation: Rotation) {
  if (rotation === "high") return settings.rotationHighMillis;
  if (rotation === "max") return settings.rotationMaxMillis;
  return settings.rotationStandardMillis;
}

export function rotationWeight(rotation: Rotation) {
  if (rotation === "high") return 2;
  if (rotation === "max") return 3;
  return 1;
}

/**
 * Brand price for one creator.
 *
 * Base daily rate is the creator's asking rate when they set one, otherwise the
 * platform tier for their average CCV. An agency floor can only raise that base.
 * Size, rotation, and category exclusivity are integer multipliers in thousandths
 * (1250 = 1.25). Each multiplier is rounded to the nearest cent before the next
 * one is applied, so the checkout line does not depend on float order.
 * Commission is deducted from the creator's side and is not added to the brand total.
 */
export function quotePlacement(input: QuoteInput): Quote | null {
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > MAX_CAMPAIGN_DAYS) return null;
  const tier = tierForCcv(input.ccv, input.tiers);
  const tierDaily = tier?.dailyRateCents ?? 0;
  const asking = input.askingDailyCents;
  const floor = input.floorDailyCents ?? 0;
  const base = Math.max(asking ?? tierDaily, floor);
  if (base <= 0) return null;

  const size = sizeMillis(input.settings, input.size);
  const rotation = rotationMillis(input.settings, input.rotation);
  const exclusivity = input.exclusivity ? input.settings.exclusivityMillis : 1000;
  const withSize = Math.round((base * input.days * size) / 1000);
  const withRotation = Math.round((withSize * rotation) / 1000);
  const gross = Math.round((withRotation * exclusivity) / 1000);
  const commission = Math.round((gross * input.settings.commissionBps) / 10_000);
  return {
    tierName: tier?.name ?? "Custom",
    tierDailyCents: tierDaily,
    askingDailyCents: asking,
    floorDailyCents: floor,
    baseDailyCents: base,
    days: input.days,
    sizeMillis: size,
    rotationMillis: rotation,
    exclusivityMillis: exclusivity,
    grossCents: gross,
    commissionCents: commission,
    netCents: gross - commission,
  };
}

export function commissionOn(grossCents: number, commissionBps: number) {
  return Math.round((grossCents * commissionBps) / 10_000);
}
