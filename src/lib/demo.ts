export const DEMO_PASSWORD = "CastlineDemo!2026";

export const DEMO_ACCOUNTS = [
  { role: "Advertiser", email: "brand@castline.dev" },
  { role: "Creator", email: "maya@castline.dev" },
  { role: "Agency", email: "agency@castline.dev" },
  { role: "Administrator", email: "admin@castline.dev" },
] as const;

export function demoEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.SEED_DEMO !== "false";
}
