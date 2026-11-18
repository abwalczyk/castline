import assert from "node:assert/strict";
import test from "node:test";
import { actorCanDecide, resolveParticipant } from "../src/lib/approval";
import { detectMedia } from "../src/lib/media-type";
import { expandByWeight } from "../src/lib/playlist";
import { inclusiveDays, quotePlacement, type PricingSettings, type PricingTier } from "../src/lib/pricing";
import { safeNextPath } from "../src/lib/paths";
import { validateDestinationUrl } from "../src/lib/urls";
import { parseDollarsToCents, parseTwitchLogin, slugify } from "../src/lib/validate";

const settings: PricingSettings = {
  commissionBps: 2000,
  exclusivityMillis: 1500,
  rotationStandardMillis: 1000,
  rotationHighMillis: 1400,
  rotationMaxMillis: 1800,
  sizeSmallMillis: 1000,
  sizeMediumMillis: 1250,
  sizeLargeMillis: 1600,
};

const tiers: PricingTier[] = [
  { name: "Established", minCcv: 250, maxCcv: 999, dailyRateCents: 22000, active: true },
  { name: "Scale", minCcv: 1000, maxCcv: 4999, dailyRateCents: 60000, active: true },
];

test("inclusive dates reject impossible calendar days and ranges over 90", () => {
  assert.equal(inclusiveDays("2026-11-17", "2026-11-24"), 8);
  assert.equal(inclusiveDays("2026-02-31", "2026-03-02"), null);
  assert.equal(inclusiveDays("2026-01-01", "2026-04-15"), null);
});

test("quotes use the creator rate, then apply rounded multipliers", () => {
  const quoted = quotePlacement({
    ccv: 420,
    days: 8,
    askingDailyCents: 18000,
    floorDailyCents: null,
    size: "medium",
    rotation: "standard",
    exclusivity: false,
    tiers,
    settings,
  });
  assert.equal(quoted?.tierName, "Established");
  assert.equal(quoted?.baseDailyCents, 18000);
  assert.equal(quoted?.grossCents, 180000);
  assert.equal(quoted?.commissionCents, 36000);
  assert.equal(quoted?.netCents, 144000);
});

test("an agency floor can raise the platform tier", () => {
  const quoted = quotePlacement({
    ccv: 1500,
    days: 1,
    askingDailyCents: null,
    floorDailyCents: 70000,
    size: "small",
    rotation: "standard",
    exclusivity: false,
    tiers,
    settings,
  });
  assert.equal(quoted?.tierDailyCents, 60000);
  assert.equal(quoted?.baseDailyCents, 70000);
  assert.equal(quoted?.grossCents, 70000);
});

test("category exclusivity is a separate multiplier", () => {
  const quoted = quotePlacement({
    ccv: 260,
    days: 7,
    askingDailyCents: null,
    floorDailyCents: null,
    size: "medium",
    rotation: "standard",
    exclusivity: true,
    tiers,
    settings,
  });
  assert.equal(quoted?.grossCents, 288750);
});

test("approval rules only count the required party", () => {
  assert.equal(resolveParticipant("self", "approved", "rejected"), "approved");
  assert.equal(resolveParticipant("manager", "approved", null), "pending");
  assert.equal(resolveParticipant("either", null, "approved"), "approved");
  assert.equal(resolveParticipant("both", "approved", null), "pending");
  assert.equal(resolveParticipant("both", "approved", "changes_requested"), "changes_requested");
  assert.equal(actorCanDecide("manager", "streamer"), false);
  assert.equal(actorCanDecide("both", "manager"), true);
});

test("destination URLs stay on public https hosts", () => {
  assert.equal(validateDestinationUrl("https://northwind.example/kettle").ok, true);
  assert.equal(validateDestinationUrl("http://northwind.example").ok, false);
  assert.equal(validateDestinationUrl("https://localhost/admin").ok, false);
  assert.equal(validateDestinationUrl("https://192.168.1.20/offer").ok, false);
  assert.equal(validateDestinationUrl("https://user:pass@northwind.example").ok, false);
});

test("playback weight repeats a buy without exceeding five", () => {
  assert.equal(expandByWeight([{ id: "a", weight: 3 }]).length, 3);
  assert.equal(expandByWeight([{ id: "a", weight: 9 }]).length, 5);
});

test("uploads are recognized from bytes, not the browser mime", () => {
  assert.equal(detectMedia(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.type, "image");
  assert.equal(detectMedia(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))?.type, "gif");
  const mp4 = new Uint8Array(12);
  mp4.set([0x66, 0x74, 0x79, 0x70], 4);
  assert.equal(detectMedia(mp4)?.type, "mp4");
  assert.equal(detectMedia(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c])), null);
});

test("form helpers reject open redirects, bad money, and twitch urls", () => {
  assert.equal(safeNextPath("//evil.example", "/brand"), "/brand");
  assert.equal(safeNextPath("/brand/campaigns", "/brand"), "/brand/campaigns");
  assert.equal(parseDollarsToCents("19.99"), 1999);
  assert.equal(parseDollarsToCents("19.999"), null);
  assert.equal(parseTwitchLogin("https://www.twitch.tv/MayaChen"), "mayachen");
  assert.equal(slugify("Maya Chen"), "maya-chen");
});
