"use server";

import { run } from "@/lib/action-run";
import { requireRole } from "@/lib/auth";
import { success } from "@/lib/action-state";
import { bpsField, centsField, field, intField, megabytesField, millisField, uuidField } from "@/lib/fields";
import {
  closeDispute,
  forcePlacement,
  moderateCreative,
  overridePrice,
  releasePayout,
  removeTier,
  reviewCampaign,
  savePlatformSettings,
  saveTier,
  setAccountState,
  toggleDemo,
  verifyChannel,
} from "@/lib/operations";

export async function setAccountAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await setAccountState(user, uuidField(formData, "userId"), field(formData.get("status")));
    return success("Account updated.");
  });
}

export async function verifyChannelAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await verifyChannel(user, uuidField(formData, "streamerId"), field(formData.get("decision")) === "approve");
    return success("Channel review saved.");
  });
}

export async function toggleDemoAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await toggleDemo(user, uuidField(formData, "streamerId"), formData.get("enabled") === "on");
    return success("Marketing demo setting saved.");
  });
}

export async function reviewCampaignAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await reviewCampaign(user, uuidField(formData, "campaignId"), field(formData.get("review")), field(formData.get("note")));
    return success("Campaign review saved.");
  });
}

export async function moderateCreativeAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await moderateCreative(user, uuidField(formData, "creativeId"), field(formData.get("status")), field(formData.get("note")));
    return success("Creative moderation saved.");
  });
}

export async function overridePriceAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    const raw = field(formData.get("rate"));
    await overridePrice(
      user,
      uuidField(formData, "campaignId"),
      uuidField(formData, "streamerId"),
      raw ? centsField(formData, "rate", "negotiated price") : null,
    );
    return success(raw ? "Negotiated price saved." : "Override cleared. The calculated price is charged.");
  });
}

export async function forcePlacementAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await forcePlacement(
      user,
      uuidField(formData, "campaignId"),
      uuidField(formData, "streamerId"),
      field(formData.get("decision")),
    );
    return success("Placement decision overridden.");
  });
}

export async function saveSettingsAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await savePlatformSettings(user, {
      commissionBps: bpsField(formData, "commission"),
      minPlaybacksToRelease: intField(formData, "minPlaybacks", 0, 10_000, "Minimum playbacks"),
      exclusivityMillis: millisField(formData, "exclusivity", "Exclusivity"),
      rotationStandardMillis: millisField(formData, "rotationStandard", "Standard rotation"),
      rotationHighMillis: millisField(formData, "rotationHigh", "High rotation"),
      rotationMaxMillis: millisField(formData, "rotationMax", "Max rotation"),
      sizeSmallMillis: millisField(formData, "sizeSmall", "Small placement"),
      sizeMediumMillis: millisField(formData, "sizeMedium", "Medium placement"),
      sizeLargeMillis: millisField(formData, "sizeLarge", "Large placement"),
      maxImageBytes: megabytesField(formData, "imageMb", "Image limit"),
      maxGifBytes: megabytesField(formData, "gifMb", "GIF limit"),
      maxVideoBytes: megabytesField(formData, "videoMb", "Video limit"),
      maxVideoSeconds: intField(formData, "videoSeconds", 5, 120, "Video duration"),
      requireBrandApproval: formData.get("requireBrandApproval") === "on",
    });
    return success("Pricing settings saved. New quotes use them immediately.");
  });
}

export async function saveTierAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    const existing = field(formData.get("id"));
    await saveTier(user, {
      id: existing ? uuidField(formData, "id") : undefined,
      name: field(formData.get("name")),
      minCcv: intField(formData, "minCcv", 0, 10_000_000, "Minimum CCV"),
      maxCcv: field(formData.get("maxCcv")) ? intField(formData, "maxCcv", 0, 10_000_000, "Maximum CCV") : null,
      dailyRateCents: centsField(formData, "daily", "daily rate"),
      active: formData.get("active") === "on",
    });
    return success("Tier saved.");
  });
}

export async function removeTierAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await removeTier(user, uuidField(formData, "id"));
    return success("Tier removed.");
  });
}

export async function closeDisputeAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    const outcome = field(formData.get("outcome"));
    await closeDispute(
      user,
      uuidField(formData, "disputeId"),
      outcome,
      field(formData.get("note")),
      outcome === "refund" ? centsField(formData, "refund", "refund") : 0,
    );
    return success("Dispute closed.");
  });
}

export async function releasePayoutAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("admin");
    await releasePayout(user, uuidField(formData, "streamerId"), field(formData.get("note")));
    return success("Payout recorded.");
  });
}
