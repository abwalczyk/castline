"use server";

import { run } from "@/lib/action-run";
import { requireRole } from "@/lib/auth";
import { success } from "@/lib/action-state";
import { RESTRICTED_TAGS } from "@/lib/constants";
import { field, intField, optionalCents } from "@/lib/fields";
import {
  acceptAgencyInvite,
  revokeOverlay,
  saveOverlay,
  savePayoutAccount,
  saveStreamerChannel,
  saveStreamerCommercial,
} from "@/lib/operations";
import { parseCheckedTags } from "@/lib/validate";

export async function saveChannel(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await saveStreamerChannel(user, {
      displayName: field(formData.get("displayName")),
      bio: field(formData.get("bio")),
      category: field(formData.get("category")),
      language: field(formData.get("language")),
      avgCcv: intField(formData, "avgCcv", 0, 10_000_000, "Average CCV"),
      followerCount: intField(formData, "followers", 0, 100_000_000, "Followers"),
      twitch: field(formData.get("twitch")),
    });
    return success("Channel profile saved. A changed Twitch login goes back to pending verification.");
  });
}

export async function saveCommercial(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await saveStreamerCommercial(user, {
      dailyRateCents: optionalCents(formData, "dailyRate", "daily rate"),
      placementSize: field(formData.get("size")),
      acceptingAds: formData.get("accepting") === "on",
      maxConcurrent: intField(formData, "maxConcurrent", 1, 20, "Concurrent campaigns"),
      minDays: intField(formData, "minDays", 1, 90, "Minimum days"),
      maxDays: intField(formData, "maxDays", 1, 90, "Maximum days"),
      blockedTags: parseCheckedTags(formData.getAll("blocked"), RESTRICTED_TAGS),
      approvalMode: field(formData.get("approvalMode")),
    });
    return success("Rates and inventory saved.");
  });
}

export async function saveOverlayAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await saveOverlay(user, {
      width: intField(formData, "width", 320, 3840, "Width"),
      height: intField(formData, "height", 180, 2160, "Height"),
      position: field(formData.get("position")),
      size: field(formData.get("size")),
      audio: formData.get("audio") === "on",
    });
    return success("Browser source settings saved. The URL itself did not change.");
  });
}

export async function revokeOverlayAction(_state: unknown, _formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await revokeOverlay(user);
    return success("The previous browser source URL no longer works. Copy the new one into OBS.");
  });
}

export async function acceptInviteAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await acceptAgencyInvite(user, field(formData.get("code")));
    return success("You are now represented by that agency.");
  });
}

export async function savePayoutAccountAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("streamer");
    await savePayoutAccount(user, field(formData.get("accountId")));
    return success("Payout account saved. Earnings still release only after delivery requirements are met.");
  });
}
