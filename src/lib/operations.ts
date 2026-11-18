import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { actorCanDecide, resolveParticipant } from "@/lib/approval";
import {
  APPROVAL_MODES,
  BRAND_VERTICALS,
  CONTENT_CATEGORIES,
  DURATIONS,
  LANGUAGES,
  PLACEMENT_SIZES,
  POSITIONS,
  RESTRICTED_TAGS,
  ROTATIONS,
  type ApprovalMode,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { detectMedia } from "@/lib/media-type";
import { newToken, sha256 } from "@/lib/password";
import { inclusiveDays, quotePlacement } from "@/lib/pricing";
import { refundPayment } from "@/lib/payments";
import {
  acceptInvite,
  activePlacementCount,
  agencyByOwner,
  assignPayout,
  audit,
  brandByOwner,
  creativeById,
  creatives,
  deleteCreative,
  deleteTier,
  disputeById,
  disputesForCampaign,
  forceParticipant,
  getCampaign,
  getSettings,
  insertAgency,
  insertBrand,
  insertCampaign,
  insertCreative,
  insertInvite,
  insertPayout,
  insertStreamer,
  insertTier,
  insertUser,
  inviteByCode,
  latestPaidPayment,
  linkStreamer,
  listTiers,
  markPayout,
  openDispute,
  participants,
  removeParticipant,
  replaceOverlayToken,
  replaceParticipant,
  resetCreativeReview,
  resetDecisions,
  resolveDispute,
  setAdminReview,
  setAgencyRules,
  setAgencyStatus,
  setBrandStatus,
  setCampaignStatus,
  setCreativeStatus,
  setDecision,
  setOverride,
  setPublicDemo,
  setStreamerTwitch,
  setStreamerVerification,
  setStripeAccount,
  setUserStatus,
  slugExists,
  streamerById,
  streamerByOwner,
  twitchExists,
  unpaidEligible,
  updateBrand,
  updateCampaign,
  updateOverlay,
  updateSettings,
  updateStreamerChannel,
  updateStreamerCommercial,
  updateTier,
} from "@/lib/store";
import type { Campaign, Settings, Streamer, Tier, User } from "@/lib/types";
import { putObject } from "@/lib/storage";
import { validateDestinationUrl } from "@/lib/urls";
import { hashPassword } from "@/lib/password";
import { oneOf, parseTwitchLogin, slugify } from "@/lib/validate";
import { getStripe } from "@/lib/payments";

const EDITABLE = new Set(["draft", "changes_requested", "rejected"]);

export async function registerBrand(input: {
  email: string;
  password: string;
  name: string;
  companyName: string;
  website: string;
  industry: string;
}) {
  await assertNewEmail(input.email);
  const industry = oneOf(input.industry, BRAND_VERTICALS);
  if (!industry) throw new AppError("Choose an industry.");
  const website = optionalUrl(input.website);
  const settings = await getSettings();
  const userId = randomUUID();
  const brandId = randomUUID();
  const status = settings.requireBrandApproval ? "pending" : "active";
  await insertUser({
    id: userId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    name: input.name,
    role: "brand",
    status: "active",
  });
  await insertBrand({
    id: brandId,
    ownerId: userId,
    companyName: input.companyName,
    website,
    industry,
    billingEmail: input.email,
    status,
  });
  await audit(userId, "brand.register", "brand", brandId, { status });
  return userId;
}

export async function registerStreamer(input: {
  email: string;
  password: string;
  name: string;
  displayName: string;
  twitch: string;
  category: string;
}) {
  await assertNewEmail(input.email);
  const login = parseTwitchLogin(input.twitch);
  if (!login) throw new AppError("Enter a Twitch channel name or URL.");
  if (await twitchExists(login)) throw new AppError("That Twitch channel is already registered.");
  const category = oneOf(input.category, CONTENT_CATEGORIES);
  if (!category) throw new AppError("Choose a category.");
  const userId = randomUUID();
  const streamerId = randomUUID();
  const token = newToken();
  await insertUser({
    id: userId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    name: input.name,
    role: "streamer",
    status: "active",
  });
  await insertStreamer({
    id: streamerId,
    ownerId: userId,
    slug: await uniqueSlug(input.displayName),
    displayName: input.displayName,
    twitchLogin: login,
    category,
    token,
    tokenHash: sha256(token),
  });
  await audit(userId, "streamer.register", "streamer", streamerId, { twitch: login });
  return userId;
}

export async function registerAgency(input: { email: string; password: string; name: string; agencyName: string; website: string }) {
  await assertNewEmail(input.email);
  const userId = randomUUID();
  const agencyId = randomUUID();
  await insertUser({
    id: userId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    name: input.name,
    role: "manager",
    status: "active",
  });
  await insertAgency({
    id: agencyId,
    ownerId: userId,
    name: input.agencyName,
    website: optionalUrl(input.website),
    status: "active",
  });
  await audit(userId, "agency.register", "agency", agencyId, {});
  return userId;
}

export async function saveBrandProfile(user: User, input: { companyName: string; website: string; industry: string; billingEmail: string }) {
  const brand = await ownedBrand(user);
  const industry = oneOf(input.industry, BRAND_VERTICALS);
  if (!industry) throw new AppError("Choose an industry.");
  if (input.companyName.trim().length < 2) throw new AppError("Enter the company name.");
  await updateBrand(brand.id, {
    companyName: input.companyName.trim().slice(0, 80),
    website: optionalUrl(input.website),
    industry,
    billingEmail: input.billingEmail,
  });
  await audit(user.id, "brand.update", "brand", brand.id, {});
}

export async function saveStreamerChannel(user: User, input: {
  displayName: string;
  bio: string;
  category: string;
  language: string;
  avgCcv: number;
  followerCount: number;
  twitch: string;
}) {
  const streamer = await ownedStreamer(user);
  const category = oneOf(input.category, CONTENT_CATEGORIES);
  const language = oneOf(input.language, LANGUAGES.map(([code]) => code));
  if (!category || !language) throw new AppError("Choose a category and language.");
  if (input.displayName.trim().length < 2) throw new AppError("Enter the name viewers know.");
  const login = parseTwitchLogin(input.twitch);
  if (!login) throw new AppError("Enter a Twitch channel name or URL.");
  if (login !== streamer.twitchLogin) {
    if (await twitchExists(login)) throw new AppError("That Twitch channel is already registered.");
    await setStreamerTwitch(streamer.id, login);
  }
  await updateStreamerChannel(streamer.id, {
    displayName: input.displayName.trim().slice(0, 80),
    bio: input.bio.trim().slice(0, 600),
    category,
    language,
    avgCcv: bounded(input.avgCcv, 0, 10_000_000, "Average CCV"),
    followerCount: bounded(input.followerCount, 0, 100_000_000, "Followers"),
  });
  await audit(user.id, "streamer.channel", "streamer", streamer.id, {});
}

export async function saveStreamerCommercial(user: User, input: {
  dailyRateCents: number | null;
  placementSize: string;
  acceptingAds: boolean;
  maxConcurrent: number;
  minDays: number;
  maxDays: number;
  blockedTags: string[];
  approvalMode: string;
}) {
  const streamer = await ownedStreamer(user);
  const size = oneOf(input.placementSize, PLACEMENT_SIZES);
  const mode = oneOf(input.approvalMode, APPROVAL_MODES);
  if (!size || !mode) throw new AppError("Choose a placement size and approval rule.");
  if (input.minDays > input.maxDays) throw new AppError("The minimum flight cannot be longer than the maximum.");
  if (streamer.minDailyRateCents != null && input.dailyRateCents != null && input.dailyRateCents < streamer.minDailyRateCents) {
    throw new AppError("That rate is below the floor set by your agency.");
  }
  await updateStreamerCommercial(streamer.id, {
    dailyRateCents: input.dailyRateCents,
    placementSize: size,
    acceptingAds: input.acceptingAds,
    maxConcurrent: bounded(input.maxConcurrent, 1, 20, "Concurrent campaigns"),
    minDays: bounded(input.minDays, 1, 90, "Minimum days"),
    maxDays: bounded(input.maxDays, 1, 90, "Maximum days"),
    blockedTags: cleanTags(input.blockedTags),
    approvalMode: streamer.linkStatus === "active" ? undefined : mode,
  });
  await audit(user.id, "streamer.commercial", "streamer", streamer.id, {});
}

export async function saveOverlay(user: User, input: { width: number; height: number; position: string; size: string; audio: boolean }) {
  const streamer = await ownedStreamer(user);
  const position = oneOf(input.position, POSITIONS);
  const size = oneOf(input.size, PLACEMENT_SIZES);
  if (!position || !size) throw new AppError("Choose a position and size.");
  await updateOverlay(streamer.id, {
    width: bounded(input.width, 320, 3840, "Width"),
    height: bounded(input.height, 180, 2160, "Height"),
    position,
    size,
    audio: input.audio,
  });
}

export async function revokeOverlay(user: User) {
  const streamer = await ownedStreamer(user);
  const token = newToken();
  await replaceOverlayToken(streamer.id, token, sha256(token));
  await audit(user.id, "overlay.revoke", "streamer", streamer.id, {});
}

export async function acceptAgencyInvite(user: User, code: string) {
  const streamer = await ownedStreamer(user);
  if (streamer.linkStatus === "active") throw new AppError("This channel is already represented.");
  const invite = await inviteByCode(code.trim().toUpperCase());
  if (!invite || invite.accepted_at) throw new AppError("That invite code is not active.");
  await linkStreamer(streamer.id, strId(invite.agency_id));
  await acceptInvite(strId(invite.id), streamer.id);
  await audit(user.id, "agency.join", "streamer", streamer.id, { agencyId: invite.agency_id });
}

export async function createAgencyInvite(user: User, email: string) {
  const agency = await ownedAgency(user);
  const code = inviteCode();
  await insertInvite({ id: randomUUID(), agencyId: agency.id, code, email: email.toLowerCase() });
  await audit(user.id, "agency.invite", "agency", agency.id, { code });
  return code;
}

export async function saveAgencyRules(user: User, streamerId: string, input: {
  minDailyRateCents: number | null;
  blockedTags: string[];
  approvalMode: string;
  acceptingAds: boolean;
}) {
  const agency = await ownedAgency(user);
  const streamer = await managedStreamer(agency.id, streamerId);
  const mode = oneOf(input.approvalMode, APPROVAL_MODES);
  if (!mode) throw new AppError("Choose an approval rule.");
  await setAgencyRules(streamer.id, {
    minDailyRateCents: input.minDailyRateCents,
    blockedTags: cleanTags(input.blockedTags),
    approvalMode: mode,
    acceptingAds: input.acceptingAds,
  });
  await audit(user.id, "agency.rules", "streamer", streamer.id, { approvalMode: mode });
}

export async function createDraft(user: User, name: string, streamerId?: string) {
  const brand = await sellableBrand(user);
  if (name.trim().length < 2) throw new AppError("Name the campaign.");
  const id = randomUUID();
  await insertCampaign({ id, brandId: brand.id, name: name.trim().slice(0, 80) });
  if (streamerId) await saveRoster(user, id, [streamerId]);
  await audit(user.id, "campaign.create", "campaign", id, {});
  return id;
}

export async function saveCampaignDetails(user: User, campaignId: string, input: {
  name: string;
  vertical: string;
  restrictedTag: string;
  destinationUrl: string;
  brief: string;
  startDate: string;
  endDate: string;
  budgetCents: number;
  placementDurationSec: number;
  rotation: string;
  placementSize: string;
  exclusivity: boolean;
}) {
  const campaign = await editableCampaign(user, campaignId);
  const vertical = oneOf(input.vertical, BRAND_VERTICALS);
  const rotation = oneOf(input.rotation, ROTATIONS);
  const size = oneOf(input.placementSize, PLACEMENT_SIZES);
  if (!vertical || !rotation || !size) throw new AppError("Check the vertical, rotation, and placement size.");
  if (!DURATIONS.includes(input.placementDurationSec as (typeof DURATIONS)[number])) {
    throw new AppError("Choose a supported placement duration.");
  }
  const restrictedTag = input.restrictedTag ? oneOf(input.restrictedTag, RESTRICTED_TAGS) : "";
  if (input.restrictedTag && !restrictedTag) throw new AppError("Unknown restricted category.");
  const destination = input.destinationUrl.trim() ? mustUrl(input.destinationUrl) : "";
  const dates = normalizeDates(input.startDate, input.endDate);
  await updateCampaign(campaign.id, {
    name: input.name.trim().slice(0, 80),
    vertical,
    restrictedTag: restrictedTag ?? "",
    destinationUrl: destination,
    brief: input.brief.trim().slice(0, 2000),
    startDate: dates.start,
    endDate: dates.end,
    budgetCents: input.budgetCents,
    placementDurationSec: input.placementDurationSec,
    rotation,
    placementSize: size,
    exclusivity: input.exclusivity,
  });
  await recalculate(campaign.id);
  await audit(user.id, "campaign.update", "campaign", campaign.id, {});
}

export async function saveRoster(user: User, campaignId: string, streamerIds: string[]) {
  const campaign = await editableCampaign(user, campaignId);
  const unique = [...new Set(streamerIds)];
  const existing = await participants(campaign.id);
  const keep = new Set(unique);
  for (const line of existing) {
    if (!keep.has(line.streamerId)) await removeParticipant(campaign.id, line.streamerId);
  }
  const tiers = await listTiers();
  const settings = await getSettings();
  const fresh = await getCampaign(campaign.id);
  if (!fresh) throw new AppError("Campaign not found.");
  for (const streamerId of unique) {
    const streamer = await streamerById(streamerId);
    if (!streamer) throw new AppError("A selected creator no longer exists.");
    assertBookable(fresh, streamer);
    if ((await activePlacementCount(streamer.id, fresh.id)) >= streamer.maxConcurrent) {
      throw new AppError(`${streamer.displayName} is at capacity.`);
    }
    const previous = existing.find((line) => line.streamerId === streamer.id);
    const quote = fresh.startDate && fresh.endDate ? quoteFor(streamer, fresh, tiers, settings) : null;
    if (fresh.startDate && fresh.endDate && !quote) {
      throw new AppError(`${streamer.displayName} cannot be priced for this flight.`);
    }
    const calculated = quote?.grossCents ?? 0;
    await replaceParticipant({
      campaignId: fresh.id,
      streamerId: streamer.id,
      calculatedCents: calculated,
      rateCents: previous?.overrideCents ?? calculated,
      snapshot: quote ? JSON.stringify(quote) : "{}",
      keepOverride: previous?.overrideCents ?? null,
    });
  }
  await audit(user.id, "campaign.roster", "campaign", campaign.id, { streamers: unique.length });
}

export async function addCreative(user: User, campaignId: string, file: File) {
  const campaign = await editableCampaign(user, campaignId);
  if (!(file instanceof File) || file.size === 0) throw new AppError("Choose a file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectMedia(bytes);
  if (!detected) throw new AppError("Upload a PNG, JPEG, WebP, GIF, or MP4.");
  const settings = await getSettings();
  const limit = detected.type === "mp4" ? settings.maxVideoBytes : detected.type === "gif" ? settings.maxGifBytes : settings.maxImageBytes;
  if (bytes.byteLength > limit) throw new AppError("That file is larger than the current upload limit.");
  const id = randomUUID();
  const extension = detected.mime.split("/")[1] === "jpeg" ? "jpg" : detected.mime.split("/")[1];
  const key = `creatives/${campaign.id}/${id}.${extension}`;
  await putObject(key, bytes, detected.mime);
  await insertCreative({
    id,
    campaignId: campaign.id,
    type: detected.type,
    storageKey: key,
    originalName: file.name.replace(/[/\\]/g, "").slice(0, 80) || "creative",
    mime: detected.mime,
    byteSize: bytes.byteLength,
  });
  await audit(user.id, "creative.upload", "creative", id, { campaignId: campaign.id, mime: detected.mime });
}

export async function removeCreative(user: User, creativeId: string) {
  const creative = await creativeById(creativeId);
  if (!creative) throw new AppError("Creative not found.");
  await editableCampaign(user, creative.campaignId);
  await deleteCreative(creative.id);
  await audit(user.id, "creative.delete", "creative", creative.id, {});
}

export async function submitCampaign(user: User, campaignId: string) {
  const campaign = await editableCampaign(user, campaignId);
  if (!campaign.destinationUrl) throw new AppError("Add an HTTPS destination URL.");
  mustUrl(campaign.destinationUrl);
  if (!campaign.startDate || !campaign.endDate) throw new AppError("Choose a start and end date.");
  await recalculate(campaign.id);
  const lines = await participants(campaign.id);
  if (lines.length === 0) throw new AppError("Choose at least one creator.");
  if (lines.some((line) => line.rateCents <= 0)) throw new AppError("Every creator on the roster needs a price.");
  const assets = await creatives(campaign.id);
  if (assets.length === 0) throw new AppError("Upload at least one creative.");
  const total = lines.reduce((sum, line) => sum + line.rateCents, 0);
  if (campaign.budgetCents < total) {
    throw new AppError("The budget is below the quoted placement total.");
  }
  await setCampaignStatus(campaign.id, "pending_approval");
  await setAdminReview(campaign.id, "pending", "");
  await resetDecisions(campaign.id);
  await resetCreativeReview(campaign.id);
  await audit(user.id, "campaign.submit", "campaign", campaign.id, { total });
}

export async function withdrawCampaign(user: User, campaignId: string) {
  const brand = await ownedBrand(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.brandId !== brand.id) throw new AppError("Campaign not found.");
  if (!["pending_approval", "changes_requested", "approved", "payment_pending", "rejected"].includes(campaign.status)) {
    throw new AppError("This campaign can no longer be withdrawn.");
  }
  await setCampaignStatus(campaign.id, "draft");
  await audit(user.id, "campaign.withdraw", "campaign", campaign.id, {});
}

export async function cancelCampaign(user: User, campaignId: string) {
  const brand = await ownedBrand(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.brandId !== brand.id) throw new AppError("Campaign not found.");
  if (["active", "completed", "cancelled"].includes(campaign.status)) {
    throw new AppError("Active and completed campaigns have to be disputed instead of cancelled.");
  }
  await setCampaignStatus(campaign.id, "cancelled");
  await audit(user.id, "campaign.cancel", "campaign", campaign.id, {});
}

export async function decidePlacement(user: User, campaignId: string, streamerId: string, decision: string, note: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.status !== "pending_approval") {
    throw new AppError("This campaign is not waiting on a decision.");
  }
  const choice = oneOf(decision, ["approved", "rejected", "changes_requested"] as const);
  if (!choice) throw new AppError("Choose a decision.");
  if (choice !== "approved" && note.trim().length < 8) {
    throw new AppError("Explain the rejection or the change you need.");
  }
  const line = (await participants(campaign.id)).find((item) => item.streamerId === streamerId);
  if (!line) throw new AppError("That creator is not on this campaign.");
  const actor = await decisionActor(user, line.approvalMode, line.ownerId, line.agencyId, line.linkStatus);
  if (!actorCanDecide(line.approvalMode, actor)) {
    throw new AppError("Your role cannot decide this placement.");
  }
  const streamerDecision = actor === "streamer" ? choice : line.streamerDecision;
  const managerDecision = actor === "manager" ? choice : line.managerDecision;
  const status = resolveParticipant(line.approvalMode, streamerDecision, managerDecision);
  await setDecision({
    campaignId,
    streamerId,
    actor,
    decision: choice,
    note: note.trim().slice(0, 1000),
    status,
  });
  await recompute(campaign.id);
  await audit(user.id, `placement.${choice}`, "campaign", campaign.id, { streamerId });
}

export async function reviewCampaign(user: User, campaignId: string, review: string, note: string) {
  assertAdmin(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || !["pending_approval", "changes_requested", "approved", "payment_pending"].includes(campaign.status)) {
    throw new AppError("This campaign is not open for review.");
  }
  const choice = oneOf(review, ["approved", "rejected", "changes_requested"] as const);
  if (!choice) throw new AppError("Choose a review outcome.");
  if (choice !== "approved" && note.trim().length < 8) throw new AppError("Leave a note for the advertiser.");
  await setAdminReview(campaign.id, choice, note.trim().slice(0, 1000));
  await recompute(campaign.id);
  await audit(user.id, `campaign.review.${choice}`, "campaign", campaign.id, {});
}

export async function moderateCreative(user: User, creativeId: string, status: string, note: string) {
  assertAdmin(user);
  const creative = await creativeById(creativeId);
  if (!creative) throw new AppError("Creative not found.");
  const choice = oneOf(status, ["approved", "rejected"] as const);
  if (!choice) throw new AppError("Choose a moderation outcome.");
  if (choice === "rejected" && note.trim().length < 8) throw new AppError("Say why the creative was rejected.");
  await setCreativeStatus(creative.id, choice, note.trim().slice(0, 1000));
  await recompute(creative.campaignId);
  await audit(user.id, `creative.${choice}`, "creative", creative.id, {});
}

export async function overridePrice(user: User, campaignId: string, streamerId: string, rateCents: number | null) {
  assertAdmin(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || !EDITABLE.has(campaign.status) && !["pending_approval", "approved", "payment_pending"].includes(campaign.status)) {
    throw new AppError("Pricing can no longer be overridden.");
  }
  const line = (await participants(campaignId)).find((item) => item.streamerId === streamerId);
  if (!line) throw new AppError("That creator is not on this campaign.");
  const rate = rateCents ?? line.calculatedCents;
  if (rate < 0) throw new AppError("Price cannot be negative.");
  await setOverride(campaignId, streamerId, rateCents, rate);
  await audit(user.id, "pricing.override", "campaign", campaignId, { streamerId, rateCents: rate });
}

export async function forcePlacement(user: User, campaignId: string, streamerId: string, decision: string) {
  assertAdmin(user);
  const choice = oneOf(decision, ["approved", "rejected", "changes_requested"] as const);
  if (!choice) throw new AppError("Choose a decision.");
  await forceParticipant(campaignId, streamerId, choice);
  await recompute(campaignId);
  await audit(user.id, "placement.force", "campaign", campaignId, { streamerId, decision: choice });
}

export async function setAccountState(user: User, targetUserId: string, status: string) {
  assertAdmin(user);
  const choice = oneOf(status, ["active", "suspended"] as const);
  if (!choice) throw new AppError("Choose active or suspended.");
  if (targetUserId === user.id && choice === "suspended") throw new AppError("You cannot suspend your own account.");
  await setUserStatus(targetUserId, choice);
  const brand = await brandByOwner(targetUserId);
  if (brand) await setBrandStatus(brand.id, choice);
  const agency = await agencyByOwner(targetUserId);
  if (agency) await setAgencyStatus(agency.id, choice);
  const streamer = await streamerByOwner(targetUserId);
  if (streamer) await setStreamerVerification(streamer.id, streamer.verificationStatus, choice);
  await audit(user.id, `account.${choice}`, "user", targetUserId, {});
}

export async function verifyChannel(user: User, streamerId: string, approve: boolean) {
  assertAdmin(user);
  const streamer = await streamerById(streamerId);
  if (!streamer) throw new AppError("Creator not found.");
  await setStreamerVerification(streamer.id, approve ? "verified" : "rejected", approve ? "active" : "pending");
  if (approve) await setUserStatus(streamer.ownerId, "active");
  await audit(user.id, approve ? "streamer.verify" : "streamer.reject", "streamer", streamer.id, {});
}

export async function toggleDemo(user: User, streamerId: string, enabled: boolean) {
  assertAdmin(user);
  await setPublicDemo(streamerId, enabled);
  await audit(user.id, "streamer.demo", "streamer", streamerId, { enabled });
}

export async function savePlatformSettings(user: User, input: Parameters<typeof updateSettings>[0]) {
  assertAdmin(user);
  await updateSettings(input);
  await audit(user.id, "settings.update", "settings", "1", { commissionBps: input.commissionBps });
}

export async function saveTier(user: User, input: { id?: string; name: string; minCcv: number; maxCcv: number | null; dailyRateCents: number; active: boolean }) {
  assertAdmin(user);
  if (input.name.trim().length < 2) throw new AppError("Name the tier.");
  if (input.maxCcv != null && input.maxCcv < input.minCcv) throw new AppError("The tier maximum is below its minimum.");
  if (input.id) {
    await updateTier({ ...input, id: input.id, name: input.name.trim() });
  } else {
    const tiers = await listTiers();
    await insertTier({
      id: randomUUID(),
      name: input.name.trim(),
      minCcv: input.minCcv,
      maxCcv: input.maxCcv,
      dailyRateCents: input.dailyRateCents,
      sortOrder: tiers.length + 1,
    });
  }
  await audit(user.id, "tier.save", "tier", input.id ?? "new", {});
}

export async function removeTier(user: User, id: string) {
  assertAdmin(user);
  const tiers = await listTiers();
  if (tiers.filter((tier) => tier.active).length < 2 && tiers.find((tier) => tier.id === id)?.active) {
    throw new AppError("Keep at least one active tier.");
  }
  await deleteTier(id);
  await audit(user.id, "tier.delete", "tier", id, {});
}

export async function fileDispute(user: User, campaignId: string, reason: string) {
  const brand = await ownedBrand(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.brandId !== brand.id) throw new AppError("Campaign not found.");
  if (!["active", "completed", "scheduled"].includes(campaign.status)) {
    throw new AppError("Disputes open after a campaign has been paid.");
  }
  if (reason.trim().length < 20) throw new AppError("Describe the dispute in at least a sentence.");
  if ((await disputesForCampaign(campaign.id)).some((dispute) => dispute.status === "open")) {
    throw new AppError("This campaign already has an open dispute.");
  }
  const payment = await latestPaidPayment(campaign.id);
  await openDispute({
    id: randomUUID(),
    campaignId: campaign.id,
    paymentId: payment?.id ?? null,
    openedBy: user.id,
    reason: reason.trim().slice(0, 2000),
    amountCents: payment?.amountCents ?? 0,
  });
  await audit(user.id, "dispute.open", "campaign", campaign.id, {});
}

export async function closeDispute(user: User, disputeId: string, outcome: string, note: string, refundCents: number) {
  assertAdmin(user);
  const dispute = await disputeById(disputeId);
  if (!dispute || dispute.status !== "open") throw new AppError("That dispute is not open.");
  if (note.trim().length < 8) throw new AppError("Record how this was resolved.");
  if (outcome === "refund") {
    if (!dispute.paymentId) throw new AppError("This dispute has no payment to refund.");
    await refundPayment(user.id, dispute.paymentId, refundCents, note.trim());
    await resolveDispute(dispute.id, "resolved_refund", note.trim().slice(0, 2000));
  } else if (outcome === "deny") {
    await resolveDispute(dispute.id, "resolved_denied", note.trim().slice(0, 2000));
  } else {
    throw new AppError("Choose refund or deny.");
  }
  await audit(user.id, "dispute.close", "dispute", dispute.id, { outcome });
}

export async function releasePayout(user: User, streamerId: string, note: string) {
  assertAdmin(user);
  const earnings = await unpaidEligible(streamerId);
  if (earnings.length === 0) throw new AppError("No eligible earnings are waiting. Earnings stay held until the campaign has ended and the playback minimum is met.");
  const streamer = await streamerById(streamerId, true);
  if (!streamer) throw new AppError("Creator not found.");
  const amount = earnings.reduce((sum, earning) => sum + earning.netCents, 0);
  const connect = process.env.STRIPE_CONNECT === "true";
  const payoutId = randomUUID();
  await insertPayout({
    id: payoutId,
    streamerId,
    amountCents: amount,
    method: connect ? "stripe_connect" : "manual",
    note: note.trim().slice(0, 500),
  });
  await assignPayout(earnings.map((earning) => earning.id), payoutId);
  let transferId: string | null = null;
  if (connect) {
    const stripe = getStripe();
    if (!stripe || !streamer.stripeAccountId) {
      await markPayout(payoutId, "failed", null);
      throw new AppError("Stripe Connect is on, but this creator has no connected account.");
    }
    try {
      const transfer = await stripe.transfers.create({
        amount,
        currency: "usd",
        destination: streamer.stripeAccountId,
        metadata: { payoutId },
      });
      transferId = transfer.id;
    } catch (error) {
      await markPayout(payoutId, "failed", null);
      throw new AppError(error instanceof Error ? error.message : "The transfer failed.");
    }
  }
  await markPayout(payoutId, "paid", transferId);
  await audit(user.id, "payout.paid", "payout", payoutId, { amount, method: connect ? "stripe_connect" : "manual" });
}

export async function confirmTwitch(user: User, login: string) {
  const streamer = await ownedStreamer(user);
  if (streamer.status === "suspended") throw new AppError("This account is suspended.");
  const parsed = parseTwitchLogin(login);
  if (!parsed) throw new AppError("Twitch did not return a channel name.");
  if (parsed !== streamer.twitchLogin) {
    if (await twitchExists(parsed)) throw new AppError("That Twitch channel is already registered.");
    await setStreamerTwitch(streamer.id, parsed);
  }
  await setStreamerVerification(streamer.id, "verified", "active");
  await audit(user.id, "streamer.twitch", "streamer", streamer.id, { login: parsed });
}

export async function savePayoutAccount(user: User, accountId: string) {
  const streamer = await ownedStreamer(user);
  const trimmed = accountId.trim();
  if (trimmed && !/^acct_[A-Za-z0-9]+$/.test(trimmed)) {
    throw new AppError("Stripe account ids look like acct_123.");
  }
  await setStripeAccount(streamer.id, trimmed || null);
}

export async function canReadCreative(user: User, creativeId: string) {
  const creative = await creativeById(creativeId);
  if (!creative) return null;
  if (user.role === "admin") return creative;
  const campaign = await getCampaign(creative.campaignId);
  if (!campaign) return null;
  if (user.role === "brand") {
    const brand = await brandByOwner(user.id);
    return brand?.id === campaign.brandId ? creative : null;
  }
  const lines = await participants(campaign.id);
  if (user.role === "streamer") {
    const streamer = await streamerByOwner(user.id);
    return streamer && lines.some((line) => line.streamerId === streamer.id) ? creative : null;
  }
  if (user.role === "manager") {
    const agency = await agencyByOwner(user.id);
    return agency && lines.some((line) => line.agencyId === agency.id && line.linkStatus === "active") ? creative : null;
  }
  return null;
}

export function quoteFor(streamer: Streamer, campaign: Campaign, tiers: Tier[], settings: Settings) {
  if (!campaign.startDate || !campaign.endDate) return null;
  const days = inclusiveDays(campaign.startDate, campaign.endDate);
  if (!days) return null;
  if (days < streamer.minDays || days > streamer.maxDays) return null;
  return quotePlacement({
    ccv: streamer.avgCcv,
    days,
    askingDailyCents: streamer.dailyRateCents,
    floorDailyCents: streamer.minDailyRateCents,
    size: campaign.placementSize,
    rotation: campaign.rotation,
    exclusivity: campaign.exclusivity,
    tiers: tiers.map((tier) => ({
      name: tier.name,
      minCcv: tier.minCcv,
      maxCcv: tier.maxCcv,
      dailyRateCents: tier.dailyRateCents,
      active: tier.active,
    })),
    settings,
  });
}

async function recalculate(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign?.startDate || !campaign.endDate) return;
  const tiers = await listTiers();
  const settings = await getSettings();
  for (const line of await participants(campaignId)) {
    const streamer = await streamerById(line.streamerId);
    if (!streamer) continue;
    const quote = quoteFor(streamer, campaign, tiers, settings);
    if (!quote) throw new AppError(`${streamer.displayName} cannot be priced for these dates.`);
    await replaceParticipant({
      campaignId,
      streamerId: streamer.id,
      calculatedCents: quote.grossCents,
      rateCents: line.overrideCents ?? quote.grossCents,
      snapshot: JSON.stringify(quote),
      keepOverride: line.overrideCents,
    });
  }
}

async function recompute(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign || ["draft", "scheduled", "active", "completed", "cancelled"].includes(campaign.status)) return;
  const lines = await participants(campaignId);
  const assets = await creatives(campaignId);
  const states = lines.map((line) => resolveParticipant(line.approvalMode, line.streamerDecision, line.managerDecision));
  let next: Campaign["status"] = "pending_approval";
  if (campaign.adminReview === "rejected" || states.includes("rejected")) next = "rejected";
  else if (campaign.adminReview === "changes_requested" || states.includes("changes_requested")) next = "changes_requested";
  else if (
    lines.length > 0 &&
    states.every((state) => state === "approved") &&
    campaign.adminReview === "approved" &&
    assets.some((asset) => asset.status === "approved") &&
    assets.every((asset) => asset.status !== "pending_review")
  ) {
    next = campaign.status === "payment_pending" ? "payment_pending" : "approved";
  }
  if (next !== campaign.status) await setCampaignStatus(campaign.id, next);
}

function assertBookable(campaign: Campaign, streamer: Streamer) {
  if (streamer.status !== "active" || streamer.verificationStatus !== "verified" || !streamer.acceptingAds) {
    throw new AppError(`${streamer.displayName} is not accepting placements.`);
  }
  if (campaign.restrictedTag && streamer.blockedTags.includes(campaign.restrictedTag)) {
    throw new AppError(`${streamer.displayName} does not accept ${campaign.restrictedTag}.`);
  }
  if (campaign.startDate && campaign.endDate) {
    const days = inclusiveDays(campaign.startDate, campaign.endDate);
    if (days != null && (days < streamer.minDays || days > streamer.maxDays)) {
      throw new AppError(`${streamer.displayName} accepts flights of ${streamer.minDays}–${streamer.maxDays} days.`);
    }
  }
}

async function editableCampaign(user: User, campaignId: string) {
  const brand = await sellableBrand(user);
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.brandId !== brand.id) throw new AppError("Campaign not found.");
  if (!EDITABLE.has(campaign.status)) throw new AppError("This campaign is locked. Withdraw it before editing.");
  return campaign;
}

async function sellableBrand(user: User) {
  const brand = await ownedBrand(user);
  if (brand.status !== "active") throw new AppError("Your advertiser profile is waiting for approval.");
  return brand;
}

async function ownedBrand(user: User) {
  if (user.role !== "brand") throw new AppError("Advertiser access is required.");
  const brand = await brandByOwner(user.id);
  if (!brand) throw new AppError("Advertiser profile not found.");
  return brand;
}

async function ownedStreamer(user: User) {
  if (user.role !== "streamer") throw new AppError("Creator access is required.");
  const streamer = await streamerByOwner(user.id, true);
  if (!streamer) throw new AppError("Creator profile not found.");
  return streamer;
}

async function ownedAgency(user: User) {
  if (user.role !== "manager") throw new AppError("Agency access is required.");
  const agency = await agencyByOwner(user.id);
  if (!agency || agency.status !== "active") throw new AppError("Agency profile not found.");
  return agency;
}

async function managedStreamer(agencyId: string, streamerId: string) {
  const streamer = await streamerById(streamerId, true);
  if (!streamer || streamer.agencyId !== agencyId || streamer.linkStatus !== "active") {
    throw new AppError("That creator is not on your roster.");
  }
  return streamer;
}

async function decisionActor(
  user: User,
  mode: ApprovalMode,
  ownerId: string,
  agencyId: string | null,
  linkStatus: string,
): Promise<"streamer" | "manager"> {
  if (user.role === "streamer") {
    const streamer = await ownedStreamer(user);
    if (streamer.ownerId !== ownerId) throw new AppError("This placement belongs to another creator.");
    if (!actorCanDecide(mode, "streamer")) throw new AppError("Your agency decides this placement.");
    return "streamer";
  }
  if (user.role === "manager") {
    const agency = await ownedAgency(user);
    if (agency.id !== agencyId || linkStatus !== "active") throw new AppError("This creator is not on your roster.");
    if (!actorCanDecide(mode, "manager")) throw new AppError("The creator decides this placement.");
    return "manager";
  }
  throw new AppError("You cannot decide this placement.");
}

function assertAdmin(user: User) {
  if (user.role !== "admin") throw new AppError("Administrator access is required.");
}

async function assertNewEmail(email: string) {
  const { findUserByEmail } = await import("@/lib/store");
  if (await findUserByEmail(email)) throw new AppError("An account with that email already exists.");
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function optionalUrl(value: string) {
  if (!value.trim()) return "";
  return mustUrl(value);
}

function mustUrl(value: string) {
  const parsed = validateDestinationUrl(value);
  if (!parsed.ok) throw new AppError(parsed.error);
  return parsed.url;
}

function normalizeDates(start: string, end: string) {
  if (!start && !end) return { start: null, end: null };
  const days = inclusiveDays(start, end);
  if (!days) throw new AppError("Use a valid date range of 90 days or less.");
  return { start, end };
}

function bounded(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(`${label} must be between ${min} and ${max}.`);
  }
  return value;
}

function cleanTags(tags: string[]) {
  return [...new Set(tags.filter((tag) => (RESTRICTED_TAGS as readonly string[]).includes(tag)))];
}

function strId(value: unknown) {
  return String(value);
}

function inviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomBytes(8).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    if (code.length === 8) return code;
  }
  return randomUUID().slice(0, 8).toUpperCase();
}
