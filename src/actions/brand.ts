"use server";

import { redirect } from "next/navigation";
import { run } from "@/lib/action-run";
import { requireRole } from "@/lib/auth";
import { success } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { centsField, field, intField, optionalCents, uuidField } from "@/lib/fields";
import { beginCheckout, markCampaignPaid, simulatePaymentsAllowed } from "@/lib/payments";
import { requestOrigin } from "@/lib/origin";
import {
  addCreative,
  createDraft,
  fileDispute,
  removeCreative,
  saveBrandProfile,
  saveCampaignDetails,
  saveRoster,
  submitCampaign,
  withdrawCampaign,
} from "@/lib/operations";
import { brandByOwner, getCampaign } from "@/lib/store";
import { parseEmail, parseUuid } from "@/lib/validate";

export async function saveProfile(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    const billingEmail = parseEmail(formData.get("billingEmail"));
    if (!billingEmail) throw new AppError("Enter a billing email.");
    await saveBrandProfile(user, {
      companyName: field(formData.get("companyName")),
      website: field(formData.get("website")),
      industry: field(formData.get("industry")),
      billingEmail,
    });
    return success("Advertiser profile saved.");
  });
}

export async function startCampaign(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    const ids = [
      ...new Set(
        formData
          .getAll("streamerId")
          .map((value) => parseUuid(value))
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const id = await createDraft(user, field(formData.get("name")), ids.length === 1 ? ids[0] : undefined);
    if (ids.length > 1) await saveRoster(user, id, ids);
    redirect(`/brand/campaigns/${id}`);
  });
}

export async function saveDetails(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    await saveCampaignDetails(user, uuidField(formData, "campaignId"), {
      name: field(formData.get("name")),
      vertical: field(formData.get("vertical")),
      restrictedTag: field(formData.get("restrictedTag")),
      destinationUrl: field(formData.get("destinationUrl")),
      brief: field(formData.get("brief")),
      startDate: field(formData.get("startDate")),
      endDate: field(formData.get("endDate")),
      budgetCents: optionalCents(formData, "budget", "budget") ?? 0,
      placementDurationSec: intField(formData, "duration", 5, 90, "Duration"),
      rotation: field(formData.get("rotation")),
      placementSize: field(formData.get("size")),
      exclusivity: formData.get("exclusivity") === "on",
    });
    return success("Campaign details saved. Prices were recalculated.");
  });
}

export async function saveRosterAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    const ids = formData
      .getAll("streamer")
      .map((value) => parseUuid(value))
      .filter((value): value is string => Boolean(value));
    await saveRoster(user, uuidField(formData, "campaignId"), ids);
    return success("Roster updated.");
  });
}

export async function uploadCreative(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("Choose a file.");
    await addCreative(user, uuidField(formData, "campaignId"), file);
    return success("Creative uploaded. It stays pending until a moderator approves it.");
  });
}

export async function deleteCreativeAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    await removeCreative(user, uuidField(formData, "creativeId"));
    return success("Creative removed.");
  });
}

export async function submitCampaignAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    await submitCampaign(user, uuidField(formData, "campaignId"));
    return success("Submitted for creator and platform review.");
  });
}

export async function withdrawCampaignAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    await withdrawCampaign(user, uuidField(formData, "campaignId"));
    return success("Campaign returned to draft.");
  });
}

export async function openDisputeAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    await fileDispute(user, uuidField(formData, "campaignId"), field(formData.get("reason")));
    return success("Dispute opened.");
  });
}

export async function checkoutAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("brand");
    const id = uuidField(formData, "campaignId");
    const brand = await brandByOwner(user.id);
    const campaign = await getCampaign(id);
    if (!brand || !campaign || campaign.brandId !== brand.id) throw new AppError("Campaign not found.");
    const result = await beginCheckout(campaign, await requestOrigin());
    if (field(formData.get("mode")) === "simulate") {
      if (!simulatePaymentsAllowed()) {
        throw new AppError("Simulated checkout is only available without Stripe keys, outside production.");
      }
      await markCampaignPaid(result.paymentId, null);
      redirect(`/brand/campaigns/${id}?paid=1`);
    }
    if (!result.url) throw new AppError("Stripe is not configured. Use the simulated payment while developing.");
    redirect(result.url);
  });
}
