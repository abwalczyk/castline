import type { Row } from "@/lib/db";
import type { Quote } from "@/lib/pricing";
import type {
  Agency,
  AuditEntry,
  Brand,
  Campaign,
  Creative,
  Dispute,
  Earning,
  Participant,
  Payment,
  Payout,
  Settings,
  Streamer,
  Tier,
  User,
} from "@/lib/types";

export function num(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

export function numOrNull(value: unknown) {
  if (value == null || value === "") return null;
  return num(value);
}

export function str(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function strOrNull(value: unknown) {
  if (value == null || value === "") return null;
  return str(value);
}

export function bool(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

export function tags(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [];
}

function quote(value: unknown): Quote | null {
  if (typeof value !== "string" || value === "" || value === "{}") return null;
  try {
    const parsed = JSON.parse(value) as Quote;
    if (!parsed || typeof parsed.grossCents !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function mapUser(row: Row): User {
  return {
    id: str(row.id),
    email: str(row.email),
    name: str(row.name),
    role: str(row.role) as User["role"],
    status: str(row.status) as User["status"],
  };
}

export function mapBrand(row: Row): Brand {
  return {
    id: str(row.id),
    ownerId: str(row.owner_id),
    companyName: str(row.company_name),
    website: str(row.website),
    industry: str(row.industry),
    billingEmail: str(row.billing_email),
    status: str(row.status) as Brand["status"],
  };
}

export function mapAgency(row: Row): Agency {
  return {
    id: str(row.id),
    ownerId: str(row.owner_id),
    name: str(row.name),
    website: str(row.website),
    status: str(row.status) as Agency["status"],
  };
}

export function mapStreamer(row: Row): Streamer {
  return {
    id: str(row.id),
    ownerId: str(row.owner_id),
    agencyId: strOrNull(row.agency_id),
    linkStatus: str(row.link_status) as Streamer["linkStatus"],
    slug: str(row.slug),
    displayName: str(row.display_name),
    twitchLogin: str(row.twitch_login),
    verificationStatus: str(row.verification_status) as Streamer["verificationStatus"],
    bio: str(row.bio),
    category: str(row.category),
    language: str(row.language),
    avgCcv: num(row.avg_ccv),
    followerCount: num(row.follower_count),
    dailyRateCents: numOrNull(row.daily_rate_cents),
    minDailyRateCents: numOrNull(row.min_daily_rate_cents),
    placementSize: str(row.placement_size) as Streamer["placementSize"],
    overlayWidth: num(row.overlay_width),
    overlayHeight: num(row.overlay_height),
    overlayPosition: str(row.overlay_position),
    overlayAudio: bool(row.overlay_audio),
    acceptingAds: bool(row.accepting_ads),
    maxConcurrent: num(row.max_concurrent),
    minDays: num(row.min_days),
    maxDays: num(row.max_days),
    blockedTags: tags(row.blocked_tags),
    approvalMode: str(row.approval_mode) as Streamer["approvalMode"],
    overlayToken: strOrNull(row.overlay_token),
    publicDemo: bool(row.public_demo),
    stripeAccountId: strOrNull(row.stripe_account_id),
    status: str(row.status) as Streamer["status"],
  };
}

export function mapSettings(row: Row): Settings {
  return {
    commissionBps: num(row.commission_bps),
    minPlaybacksToRelease: num(row.min_playbacks_to_release),
    exclusivityMillis: num(row.exclusivity_millis),
    rotationStandardMillis: num(row.rotation_standard_millis),
    rotationHighMillis: num(row.rotation_high_millis),
    rotationMaxMillis: num(row.rotation_max_millis),
    sizeSmallMillis: num(row.size_small_millis),
    sizeMediumMillis: num(row.size_medium_millis),
    sizeLargeMillis: num(row.size_large_millis),
    maxImageBytes: num(row.max_image_bytes),
    maxGifBytes: num(row.max_gif_bytes),
    maxVideoBytes: num(row.max_video_bytes),
    maxVideoSeconds: num(row.max_video_seconds),
    currency: str(row.currency),
    requireBrandApproval: bool(row.require_brand_approval),
  };
}

export function mapTier(row: Row): Tier {
  return {
    id: str(row.id),
    name: str(row.name),
    minCcv: num(row.min_ccv),
    maxCcv: numOrNull(row.max_ccv),
    dailyRateCents: num(row.daily_rate_cents),
    sortOrder: num(row.sort_order),
    active: bool(row.active),
  };
}

export function mapCampaign(row: Row): Campaign {
  return {
    id: str(row.id),
    brandId: str(row.brand_id),
    name: str(row.name),
    status: str(row.status) as Campaign["status"],
    vertical: str(row.vertical),
    restrictedTag: str(row.restricted_tag),
    destinationUrl: str(row.destination_url),
    brief: str(row.brief),
    startDate: strOrNull(row.start_date),
    endDate: strOrNull(row.end_date),
    budgetCents: num(row.budget_cents),
    placementDurationSec: num(row.placement_duration_sec),
    rotation: str(row.rotation) as Campaign["rotation"],
    placementSize: str(row.placement_size) as Campaign["placementSize"],
    exclusivity: bool(row.exclusivity),
    adminReview: str(row.admin_review) as Campaign["adminReview"],
    adminNote: str(row.admin_note),
    streamerCount: row.streamer_count == null ? undefined : num(row.streamer_count),
    quoteCents: row.quote_cents == null ? undefined : num(row.quote_cents),
    companyName: row.company_name == null ? undefined : str(row.company_name),
  };
}

export function mapParticipant(row: Row): Participant {
  return {
    campaignId: str(row.campaign_id),
    streamerId: str(row.streamer_id),
    status: str(row.status) as Participant["status"],
    calculatedCents: num(row.calculated_cents),
    overrideCents: numOrNull(row.override_cents),
    rateCents: num(row.rate_cents),
    snapshot: quote(row.price_snapshot),
    note: str(row.note),
    streamerDecision: strOrNull(row.streamer_decision) as Participant["streamerDecision"],
    managerDecision: strOrNull(row.manager_decision) as Participant["managerDecision"],
    displayName: str(row.display_name),
    slug: str(row.slug),
    avgCcv: num(row.avg_ccv),
    approvalMode: str(row.approval_mode) as Participant["approvalMode"],
    ownerId: str(row.owner_id),
    agencyId: strOrNull(row.agency_id),
    linkStatus: str(row.link_status),
  };
}

export function mapCreative(row: Row): Creative {
  return {
    id: str(row.id),
    campaignId: str(row.campaign_id),
    type: str(row.type) as Creative["type"],
    storageKey: str(row.storage_key),
    originalName: str(row.original_name),
    mime: str(row.mime),
    byteSize: num(row.byte_size),
    status: str(row.status) as Creative["status"],
    moderationNote: str(row.moderation_note),
  };
}

export function mapPayment(row: Row): Payment {
  return {
    id: str(row.id),
    campaignId: str(row.campaign_id),
    amountCents: num(row.amount_cents),
    commissionCents: num(row.commission_cents),
    refundedCents: num(row.refunded_cents),
    currency: str(row.currency),
    status: str(row.status) as Payment["status"],
    stripeCheckoutSessionId: strOrNull(row.stripe_checkout_session_id),
    stripePaymentIntentId: strOrNull(row.stripe_payment_intent_id),
    paidAt: strOrNull(row.paid_at),
  };
}

export function mapEarning(row: Row): Earning {
  return {
    id: str(row.id),
    streamerId: str(row.streamer_id),
    campaignId: str(row.campaign_id),
    paymentId: strOrNull(row.payment_id),
    grossCents: num(row.gross_cents),
    commissionCents: num(row.commission_cents),
    netCents: num(row.net_cents),
    status: str(row.status) as Earning["status"],
    payoutId: strOrNull(row.payout_id),
    eligibleAt: strOrNull(row.eligible_at),
    campaignName: row.campaign_name == null ? undefined : str(row.campaign_name),
    streamerName: row.streamer_name == null ? undefined : str(row.streamer_name),
  };
}

export function mapPayout(row: Row): Payout {
  return {
    id: str(row.id),
    streamerId: str(row.streamer_id),
    amountCents: num(row.amount_cents),
    status: str(row.status) as Payout["status"],
    method: str(row.method) as Payout["method"],
    stripeTransferId: strOrNull(row.stripe_transfer_id),
    note: str(row.note),
    paidAt: strOrNull(row.paid_at),
    streamerName: row.streamer_name == null ? undefined : str(row.streamer_name),
  };
}

export function mapDispute(row: Row): Dispute {
  return {
    id: str(row.id),
    campaignId: str(row.campaign_id),
    paymentId: strOrNull(row.payment_id),
    openedBy: strOrNull(row.opened_by),
    reason: str(row.reason),
    status: str(row.status) as Dispute["status"],
    amountCents: num(row.amount_cents),
    resolutionNote: str(row.resolution_note),
    campaignName: row.campaign_name == null ? undefined : str(row.campaign_name),
  };
}

export function mapAudit(row: Row): AuditEntry {
  return {
    id: str(row.id),
    actorId: strOrNull(row.actor_id),
    action: str(row.action),
    entityType: str(row.entity_type),
    entityId: strOrNull(row.entity_id),
    metadata: str(row.metadata),
    createdAt: str(row.created_at),
    actorEmail: row.actor_email == null ? undefined : str(row.actor_email),
  };
}
