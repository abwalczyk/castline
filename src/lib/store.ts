import "server-only";
import { randomUUID } from "node:crypto";
import { one, query, type Row } from "@/lib/db";
import {
  mapAgency,
  mapAudit,
  mapBrand,
  mapCampaign,
  mapCreative,
  mapDispute,
  mapEarning,
  mapParticipant,
  mapPayment,
  mapPayout,
  mapSettings,
  mapStreamer,
  mapTier,
  mapUser,
  str,
} from "@/lib/rows";
import type { CampaignStatus } from "@/lib/constants";

const CAMPAIGN_FIELDS = `
  c.id, c.brand_id, c.name, c.status::text as status, c.vertical, c.restricted_tag,
  c.destination_url, c.brief, c.start_date, c.end_date, c.budget_cents,
  c.placement_duration_sec, c.rotation, c.placement_size, c.exclusivity,
  c.admin_review, c.admin_note
`;

const STREAMER_FIELDS = `
  id, owner_id, agency_id, link_status, slug, display_name, twitch_login,
  verification_status::text as verification_status, bio, category, language,
  avg_ccv, follower_count, daily_rate_cents, min_daily_rate_cents, placement_size,
  overlay_width, overlay_height, overlay_position, overlay_audio, accepting_ads,
  max_concurrent, min_days, max_days, blocked_tags, approval_mode::text as approval_mode,
  public_demo, stripe_account_id, status::text as status
`;

export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await query(
    `insert into audit_logs (id, actor_id, action, entity_type, entity_id, metadata)
     values ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), actorId, action, entityType, entityId, JSON.stringify(metadata)],
  );
}

export async function findUserByEmail(email: string) {
  const row = await one<Row>(
    `select id, email, password_hash, name, role::text as role, status::text as status
     from users where email = $1`,
    [email],
  );
  if (!row) return null;
  return { user: mapUser(row), passwordHash: str(row.password_hash) };
}

export async function findUserById(id: string) {
  const row = await one(
    `select id, email, name, role::text as role, status::text as status from users where id = $1`,
    [id],
  );
  return row ? mapUser(row) : null;
}

export async function insertUser(input: {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  status: string;
}) {
  await query(
    `insert into users (id, email, password_hash, name, role, status) values ($1, $2, $3, $4, $5::user_role, $6::account_status)`,
    [input.id, input.email, input.passwordHash, input.name, input.role, input.status],
  );
}

export async function setUserStatus(id: string, status: string) {
  await query(
    `update users set status = $2::account_status, updated_at = now() where id = $1`,
    [id, status],
  );
}

export async function listUsers() {
  const rows = await query(
    `select id, email, name, role::text as role, status::text as status from users order by created_at desc`,
  );
  return rows.map(mapUser);
}

export async function insertBrand(input: {
  id: string;
  ownerId: string;
  companyName: string;
  website: string;
  industry: string;
  billingEmail: string;
  status: string;
}) {
  await query(
    `insert into brands (id, owner_id, company_name, website, industry, billing_email, status)
     values ($1, $2, $3, $4, $5, $6, $7::account_status)`,
    [input.id, input.ownerId, input.companyName, input.website, input.industry, input.billingEmail, input.status],
  );
}

export async function brandByOwner(ownerId: string) {
  const row = await one(
    `select id, owner_id, company_name, website, industry, billing_email, status::text as status
     from brands where owner_id = $1`,
    [ownerId],
  );
  return row ? mapBrand(row) : null;
}

export async function brandById(id: string) {
  const row = await one(
    `select id, owner_id, company_name, website, industry, billing_email, status::text as status
     from brands where id = $1`,
    [id],
  );
  return row ? mapBrand(row) : null;
}

export async function listBrands() {
  const rows = await query(
    `select b.id, b.owner_id, b.company_name, b.website, b.industry, b.billing_email, b.status::text as status
     from brands b order by b.created_at desc`,
  );
  return rows.map(mapBrand);
}

export async function updateBrand(
  id: string,
  input: { companyName: string; website: string; industry: string; billingEmail: string },
) {
  await query(
    `update brands set company_name = $2, website = $3, industry = $4, billing_email = $5, updated_at = now()
     where id = $1`,
    [id, input.companyName, input.website, input.industry, input.billingEmail],
  );
}

export async function setBrandStatus(id: string, status: string) {
  await query(`update brands set status = $2::account_status, updated_at = now() where id = $1`, [id, status]);
}

export async function insertAgency(input: {
  id: string;
  ownerId: string;
  name: string;
  website: string;
  status: string;
}) {
  await query(
    `insert into agencies (id, owner_id, name, website, status) values ($1, $2, $3, $4, $5::account_status)`,
    [input.id, input.ownerId, input.name, input.website, input.status],
  );
}

export async function agencyByOwner(ownerId: string) {
  const row = await one(
    `select id, owner_id, name, website, status::text as status from agencies where owner_id = $1`,
    [ownerId],
  );
  return row ? mapAgency(row) : null;
}

export async function agencyById(id: string) {
  const row = await one(
    `select id, owner_id, name, website, status::text as status from agencies where id = $1`,
    [id],
  );
  return row ? mapAgency(row) : null;
}

export async function listAgencies() {
  const rows = await query(
    `select id, owner_id, name, website, status::text as status from agencies order by created_at desc`,
  );
  return rows.map(mapAgency);
}

export async function setAgencyStatus(id: string, status: string) {
  await query(`update agencies set status = $2::account_status, updated_at = now() where id = $1`, [id, status]);
}

export async function insertStreamer(input: {
  id: string;
  ownerId: string;
  slug: string;
  displayName: string;
  twitchLogin: string;
  category: string;
  token: string;
  tokenHash: string;
}) {
  await query(
    `insert into streamers (
      id, owner_id, slug, display_name, twitch_login, category, overlay_token, overlay_token_hash, status, verification_status
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending')`,
    [input.id, input.ownerId, input.slug, input.displayName, input.twitchLogin, input.category, input.token, input.tokenHash],
  );
}

export async function streamerByOwner(ownerId: string, withToken = false) {
  const row = await one(`${streamerSelect(withToken)} where owner_id = $1`, [ownerId]);
  return row ? mapStreamer(row) : null;
}

export async function streamerById(id: string, withToken = false) {
  const row = await one(`${streamerSelect(withToken)} where id = $1`, [id]);
  return row ? mapStreamer(row) : null;
}

export async function streamerBySlug(slug: string, withToken = false) {
  const row = await one(`${streamerSelect(withToken)} where slug = $1`, [slug]);
  return row ? mapStreamer(row) : null;
}

export async function publicDemo() {
  const row = await one(`${streamerSelect(true)} where public_demo = true and status = 'active' order by avg_ccv desc limit 1`);
  return row ? mapStreamer(row) : null;
}

export async function streamerByTokenHash(hash: string) {
  const row = await one(`${streamerSelect(false)} where overlay_token_hash = $1`, [hash]);
  return row ? mapStreamer(row) : null;
}

export async function listMarketplace(input: {
  category: string;
  minCcv: number;
  maxCcv: number;
  minFollowers: number;
  search: string;
  listedOnly: boolean;
}) {
  const rows = await query(
    `${streamerSelect(false)}
     where ($1::boolean = false or (status = 'active' and verification_status = 'verified' and accepting_ads = true))
       and ($2 = '' or category = $2)
       and avg_ccv >= $3
       and ($4 = 0 or avg_ccv <= $4)
       and follower_count >= $5
       and ($6 = '' or display_name ilike '%' || $6 || '%' or twitch_login ilike '%' || $6 || '%')
     order by avg_ccv desc
     limit 100`,
    [input.listedOnly, input.category, input.minCcv, input.maxCcv, input.minFollowers, input.search],
  );
  return rows.map(mapStreamer);
}

export async function roster(agencyId: string) {
  const rows = await query(
    `${streamerSelect(true)} where agency_id = $1 and link_status = 'active' order by display_name`,
    [agencyId],
  );
  return rows.map(mapStreamer);
}

export async function slugExists(slug: string) {
  const row = await one(`select id from streamers where slug = $1`, [slug]);
  return Boolean(row);
}

export async function twitchExists(login: string) {
  const row = await one(`select id from streamers where twitch_login = $1`, [login]);
  return Boolean(row);
}

export async function updateStreamerChannel(
  id: string,
  input: { displayName: string; bio: string; category: string; language: string; avgCcv: number; followerCount: number },
) {
  await query(
    `update streamers set display_name = $2, bio = $3, category = $4, language = $5, avg_ccv = $6,
      follower_count = $7, updated_at = now() where id = $1`,
    [id, input.displayName, input.bio, input.category, input.language, input.avgCcv, input.followerCount],
  );
}

export async function updateStreamerCommercial(
  id: string,
  input: {
    dailyRateCents: number | null;
    placementSize: string;
    acceptingAds: boolean;
    maxConcurrent: number;
    minDays: number;
    maxDays: number;
    blockedTags: string[];
    approvalMode?: string;
    minDailyRateCents?: number | null;
  },
) {
  await query(
    `update streamers set daily_rate_cents = $2, placement_size = $3, accepting_ads = $4, max_concurrent = $5,
      min_days = $6, max_days = $7, blocked_tags = $8, approval_mode = coalesce($9::approval_mode, approval_mode),
      min_daily_rate_cents = coalesce($10, min_daily_rate_cents), updated_at = now()
     where id = $1`,
    [
      id,
      input.dailyRateCents,
      input.placementSize,
      input.acceptingAds,
      input.maxConcurrent,
      input.minDays,
      input.maxDays,
      input.blockedTags,
      input.approvalMode ?? null,
      input.minDailyRateCents === undefined ? null : input.minDailyRateCents,
    ],
  );
}

export async function setAgencyRules(
  id: string,
  input: { minDailyRateCents: number | null; blockedTags: string[]; approvalMode: string; acceptingAds: boolean },
) {
  await query(
    `update streamers set min_daily_rate_cents = $2, blocked_tags = $3, approval_mode = $4::approval_mode,
      accepting_ads = $5, updated_at = now() where id = $1`,
    [id, input.minDailyRateCents, input.blockedTags, input.approvalMode, input.acceptingAds],
  );
}

export async function updateOverlay(
  id: string,
  input: { width: number; height: number; position: string; size: string; audio: boolean },
) {
  await query(
    `update streamers set overlay_width = $2, overlay_height = $3, overlay_position = $4, placement_size = $5,
      overlay_audio = $6, updated_at = now() where id = $1`,
    [id, input.width, input.height, input.position, input.size, input.audio],
  );
}

export async function replaceOverlayToken(id: string, token: string, hash: string) {
  await query(
    `update streamers set overlay_token = $2, overlay_token_hash = $3, token_revoked_at = now(), updated_at = now()
     where id = $1`,
    [id, token, hash],
  );
}

export async function setStreamerVerification(id: string, verification: string, status: string) {
  await query(
    `update streamers set verification_status = $2::verification_status, status = $3::account_status, updated_at = now()
     where id = $1`,
    [id, verification, status],
  );
}

export async function setStreamerTwitch(id: string, login: string) {
  await query(
    `update streamers set twitch_login = $2, verification_status = 'pending', updated_at = now() where id = $1`,
    [id, login],
  );
}

export async function setStripeAccount(id: string, accountId: string | null) {
  await query(`update streamers set stripe_account_id = $2, updated_at = now() where id = $1`, [id, accountId]);
}

export async function setPublicDemo(id: string, enabled: boolean) {
  await query(`update streamers set public_demo = $2, updated_at = now() where id = $1`, [id, enabled]);
}

export async function linkStreamer(streamerId: string, agencyId: string) {
  await query(
    `update streamers set agency_id = $2, link_status = 'active', updated_at = now() where id = $1`,
    [streamerId, agencyId],
  );
}

export async function activePlacementCount(streamerId: string, exceptCampaignId: string) {
  const row = await one<{ count: number | string }>(
    `select count(*) as count
     from campaign_streamers cs
     join campaigns c on c.id = cs.campaign_id
     where cs.streamer_id = $1
       and cs.status = 'approved'
       and c.status in ('scheduled'::campaign_status, 'active'::campaign_status)
       and c.id <> $2`,
    [streamerId, exceptCampaignId],
  );
  return Number(row?.count ?? 0);
}

export async function getSettings() {
  const row = await one(`select * from platform_settings where id = 1`);
  if (!row) throw new Error("Platform settings are missing.");
  return mapSettings(row);
}

export async function updateSettings(input: {
  commissionBps: number;
  minPlaybacksToRelease: number;
  exclusivityMillis: number;
  rotationStandardMillis: number;
  rotationHighMillis: number;
  rotationMaxMillis: number;
  sizeSmallMillis: number;
  sizeMediumMillis: number;
  sizeLargeMillis: number;
  maxImageBytes: number;
  maxGifBytes: number;
  maxVideoBytes: number;
  maxVideoSeconds: number;
  requireBrandApproval: boolean;
}) {
  await query(
    `update platform_settings set
      commission_bps = $1, min_playbacks_to_release = $2, exclusivity_millis = $3,
      rotation_standard_millis = $4, rotation_high_millis = $5, rotation_max_millis = $6,
      size_small_millis = $7, size_medium_millis = $8, size_large_millis = $9,
      max_image_bytes = $10, max_gif_bytes = $11, max_video_bytes = $12, max_video_seconds = $13,
      require_brand_approval = $14, updated_at = now()
     where id = 1`,
    [
      input.commissionBps,
      input.minPlaybacksToRelease,
      input.exclusivityMillis,
      input.rotationStandardMillis,
      input.rotationHighMillis,
      input.rotationMaxMillis,
      input.sizeSmallMillis,
      input.sizeMediumMillis,
      input.sizeLargeMillis,
      input.maxImageBytes,
      input.maxGifBytes,
      input.maxVideoBytes,
      input.maxVideoSeconds,
      input.requireBrandApproval,
    ],
  );
}

export async function listTiers() {
  const rows = await query(`select * from pricing_tiers order by sort_order, min_ccv`);
  return rows.map(mapTier);
}

export async function insertTier(input: {
  id: string;
  name: string;
  minCcv: number;
  maxCcv: number | null;
  dailyRateCents: number;
  sortOrder: number;
}) {
  await query(
    `insert into pricing_tiers (id, name, min_ccv, max_ccv, daily_rate_cents, sort_order, active)
     values ($1, $2, $3, $4, $5, $6, true)`,
    [input.id, input.name, input.minCcv, input.maxCcv, input.dailyRateCents, input.sortOrder],
  );
}

export async function updateTier(input: {
  id: string;
  name: string;
  minCcv: number;
  maxCcv: number | null;
  dailyRateCents: number;
  active: boolean;
}) {
  await query(
    `update pricing_tiers set name = $2, min_ccv = $3, max_ccv = $4, daily_rate_cents = $5, active = $6 where id = $1`,
    [input.id, input.name, input.minCcv, input.maxCcv, input.dailyRateCents, input.active],
  );
}

export async function deleteTier(id: string) {
  await query(`delete from pricing_tiers where id = $1`, [id]);
}

export async function insertCampaign(input: { id: string; brandId: string; name: string }) {
  await query(`insert into campaigns (id, brand_id, name) values ($1, $2, $3)`, [input.id, input.brandId, input.name]);
}

export async function getCampaign(id: string) {
  const row = await one(
    `select ${CAMPAIGN_FIELDS},
      (select count(*) from campaign_streamers cs where cs.campaign_id = c.id) as streamer_count,
      (select coalesce(sum(rate_cents), 0) from campaign_streamers cs where cs.campaign_id = c.id) as quote_cents,
      b.company_name
     from campaigns c join brands b on b.id = c.brand_id where c.id = $1`,
    [id],
  );
  return row ? mapCampaign(row) : null;
}

export async function listCampaignsForBrand(brandId: string) {
  const rows = await query(
    `select ${CAMPAIGN_FIELDS},
      (select count(*) from campaign_streamers cs where cs.campaign_id = c.id) as streamer_count,
      (select coalesce(sum(rate_cents), 0) from campaign_streamers cs where cs.campaign_id = c.id) as quote_cents
     from campaigns c where c.brand_id = $1 order by c.created_at desc`,
    [brandId],
  );
  return rows.map(mapCampaign);
}

export async function listCampaignsForStreamer(streamerId: string) {
  const rows = await query(
    `select ${CAMPAIGN_FIELDS}, b.company_name, cs.rate_cents as quote_cents
     from campaigns c
     join campaign_streamers cs on cs.campaign_id = c.id
     join brands b on b.id = c.brand_id
     where cs.streamer_id = $1 and c.status <> 'draft'::campaign_status
     order by c.created_at desc`,
    [streamerId],
  );
  return rows.map(mapCampaign);
}

export async function listCampaignsForAgency(agencyId: string) {
  const rows = await query(
    `select distinct ${CAMPAIGN_FIELDS}, b.company_name, c.created_at
     from campaigns c
     join campaign_streamers cs on cs.campaign_id = c.id
     join streamers s on s.id = cs.streamer_id
     join brands b on b.id = c.brand_id
     where s.agency_id = $1 and s.link_status = 'active' and c.status <> 'draft'::campaign_status
     order by c.created_at desc`,
    [agencyId],
  );
  return rows.map(mapCampaign);
}

export async function listCampaignsAdmin() {
  const rows = await query(
    `select ${CAMPAIGN_FIELDS}, b.company_name,
      (select coalesce(sum(rate_cents), 0) from campaign_streamers cs where cs.campaign_id = c.id) as quote_cents
     from campaigns c join brands b on b.id = c.brand_id
     order by c.created_at desc limit 200`,
  );
  return rows.map(mapCampaign);
}

export async function updateCampaign(id: string, input: {
  name: string;
  vertical: string;
  restrictedTag: string;
  destinationUrl: string;
  brief: string;
  startDate: string | null;
  endDate: string | null;
  budgetCents: number;
  placementDurationSec: number;
  rotation: string;
  placementSize: string;
  exclusivity: boolean;
}) {
  await query(
    `update campaigns set name = $2, vertical = $3, restricted_tag = $4, destination_url = $5, brief = $6,
      start_date = $7, end_date = $8, budget_cents = $9, placement_duration_sec = $10, rotation = $11,
      placement_size = $12, exclusivity = $13, updated_at = now()
     where id = $1`,
    [
      id,
      input.name,
      input.vertical,
      input.restrictedTag,
      input.destinationUrl,
      input.brief,
      input.startDate,
      input.endDate,
      input.budgetCents,
      input.placementDurationSec,
      input.rotation,
      input.placementSize,
      input.exclusivity,
    ],
  );
}

export async function setCampaignStatus(id: string, status: CampaignStatus) {
  await query(`update campaigns set status = $2::campaign_status, updated_at = now() where id = $1`, [id, status]);
}

export async function setAdminReview(id: string, review: string, note: string) {
  await query(
    `update campaigns set admin_review = $2, admin_note = $3, updated_at = now() where id = $1`,
    [id, review, note],
  );
}

export async function participants(campaignId: string) {
  const rows = await query(
    `select cs.campaign_id, cs.streamer_id, cs.status::text as status, cs.calculated_cents, cs.override_cents,
      cs.rate_cents, cs.price_snapshot, cs.note, cs.streamer_decision, cs.manager_decision,
      s.display_name, s.slug, s.avg_ccv, s.approval_mode::text as approval_mode, s.owner_id, s.agency_id, s.link_status
     from campaign_streamers cs
     join streamers s on s.id = cs.streamer_id
     where cs.campaign_id = $1
     order by s.display_name`,
    [campaignId],
  );
  return rows.map(mapParticipant);
}

export async function replaceParticipant(input: {
  campaignId: string;
  streamerId: string;
  calculatedCents: number;
  rateCents: number;
  snapshot: string;
  keepOverride: number | null;
}) {
  await query(
    `insert into campaign_streamers (campaign_id, streamer_id, calculated_cents, override_cents, rate_cents, price_snapshot)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (campaign_id, streamer_id) do update
     set calculated_cents = excluded.calculated_cents,
         rate_cents = coalesce(campaign_streamers.override_cents, excluded.calculated_cents),
         price_snapshot = excluded.price_snapshot`,
    [input.campaignId, input.streamerId, input.calculatedCents, input.keepOverride, input.rateCents, input.snapshot],
  );
}

export async function removeParticipant(campaignId: string, streamerId: string) {
  await query(`delete from campaign_streamers where campaign_id = $1 and streamer_id = $2`, [campaignId, streamerId]);
}

export async function setOverride(campaignId: string, streamerId: string, overrideCents: number | null, rateCents: number) {
  await query(
    `update campaign_streamers set override_cents = $3, rate_cents = $4 where campaign_id = $1 and streamer_id = $2`,
    [campaignId, streamerId, overrideCents, rateCents],
  );
}

export async function resetDecisions(campaignId: string) {
  await query(
    `update campaign_streamers set status = 'pending', streamer_decision = null, manager_decision = null, note = ''
     where campaign_id = $1`,
    [campaignId],
  );
}

export async function setDecision(input: {
  campaignId: string;
  streamerId: string;
  actor: "streamer" | "manager";
  decision: string;
  note: string;
  status: string;
}) {
  const column = input.actor === "streamer" ? "streamer_decision" : "manager_decision";
  await query(
    `update campaign_streamers set ${column} = $3, note = $4, status = $5::participant_status
     where campaign_id = $1 and streamer_id = $2`,
    [input.campaignId, input.streamerId, input.decision, input.note, input.status],
  );
}

export async function forceParticipant(campaignId: string, streamerId: string, decision: string) {
  await query(
    `update campaign_streamers set streamer_decision = $3, manager_decision = $3, status = $3::participant_status, note = 'Set by an administrator.'
     where campaign_id = $1 and streamer_id = $2`,
    [campaignId, streamerId, decision],
  );
}

export async function creatives(campaignId: string) {
  const rows = await query(
    `select id, campaign_id, type::text as type, storage_key, original_name, mime, byte_size, status::text as status, moderation_note
     from creatives where campaign_id = $1 order by created_at`,
    [campaignId],
  );
  return rows.map(mapCreative);
}

export async function creativeById(id: string) {
  const row = await one(
    `select id, campaign_id, type::text as type, storage_key, original_name, mime, byte_size, status::text as status, moderation_note
     from creatives where id = $1`,
    [id],
  );
  return row ? mapCreative(row) : null;
}

export async function insertCreative(input: {
  id: string;
  campaignId: string;
  type: string;
  storageKey: string;
  originalName: string;
  mime: string;
  byteSize: number;
}) {
  await query(
    `insert into creatives (id, campaign_id, type, storage_key, original_name, mime, byte_size)
     values ($1, $2, $3::creative_type, $4, $5, $6, $7)`,
    [input.id, input.campaignId, input.type, input.storageKey, input.originalName, input.mime, input.byteSize],
  );
}

export async function deleteCreative(id: string) {
  await query(`delete from creatives where id = $1`, [id]);
}

export async function setCreativeStatus(id: string, status: string, note: string) {
  await query(
    `update creatives set status = $2::creative_status, moderation_note = $3 where id = $1`,
    [id, status, note],
  );
}

export async function resetCreativeReview(campaignId: string) {
  await query(
    `update creatives set status = 'pending_review', moderation_note = '' where campaign_id = $1`,
    [campaignId],
  );
}

export async function listCreativesForReview() {
  const rows = await query(
    `select cr.id, cr.campaign_id, cr.type::text as type, cr.storage_key, cr.original_name, cr.mime, cr.byte_size,
      cr.status::text as status, cr.moderation_note
     from creatives cr
     join campaigns c on c.id = cr.campaign_id
     where c.status in ('pending_approval'::campaign_status, 'changes_requested'::campaign_status, 'approved'::campaign_status, 'payment_pending'::campaign_status)
     order by cr.created_at desc limit 200`,
  );
  return rows.map(mapCreative);
}

export async function insertPayment(input: {
  id: string;
  campaignId: string;
  amountCents: number;
  commissionCents: number;
  currency: string;
}) {
  await query(
    `update payments set status = 'failed' where campaign_id = $1 and status = 'pending'`,
    [input.campaignId],
  );
  await query(
    `insert into payments (id, campaign_id, amount_cents, commission_cents, currency) values ($1, $2, $3, $4, $5)`,
    [input.id, input.campaignId, input.amountCents, input.commissionCents, input.currency],
  );
}

export async function paymentById(id: string) {
  const row = await one(`select * from payments where id = $1`, [id]);
  return row ? mapPayment(row) : null;
}

export async function latestPaidPayment(campaignId: string) {
  const row = await one(
    `select * from payments where campaign_id = $1 and status = 'paid' order by created_at desc limit 1`,
    [campaignId],
  );
  return row ? mapPayment(row) : null;
}

export async function latestPendingPayment(campaignId: string) {
  const row = await one(
    `select * from payments where campaign_id = $1 and status = 'pending' order by created_at desc limit 1`,
    [campaignId],
  );
  return row ? mapPayment(row) : null;
}

export async function listPayments() {
  const rows = await query(
    `select p.*, c.name as campaign_name from payments p join campaigns c on c.id = p.campaign_id order by p.created_at desc limit 200`,
  );
  return rows.map((row) => ({ ...mapPayment(row), campaignName: str(row.campaign_name) }));
}

export async function attachCheckout(id: string, sessionId: string) {
  await query(`update payments set stripe_checkout_session_id = $2 where id = $1`, [id, sessionId]);
}

export async function markPaymentPaid(id: string, paymentIntentId: string | null) {
  await query(
    `update payments set status = 'paid', stripe_payment_intent_id = coalesce($2, stripe_payment_intent_id), paid_at = now()
     where id = $1 and status = 'pending'`,
    [id, paymentIntentId],
  );
}

export async function addRefund(id: string, amountCents: number, full: boolean) {
  await query(
    `update payments set refunded_cents = refunded_cents + $2, status = case when $3 then 'refunded'::payment_status else status end
     where id = $1`,
    [id, amountCents, full],
  );
}

export async function earningsForCampaign(campaignId: string) {
  const rows = await query(
    `select e.*, s.display_name as streamer_name, c.name as campaign_name
     from earnings e
     join streamers s on s.id = e.streamer_id
     join campaigns c on c.id = e.campaign_id
     where e.campaign_id = $1`,
    [campaignId],
  );
  return rows.map(mapEarning);
}

export async function earningsForStreamer(streamerId: string) {
  const rows = await query(
    `select e.*, c.name as campaign_name
     from earnings e join campaigns c on c.id = e.campaign_id
     where e.streamer_id = $1 order by e.created_at desc`,
    [streamerId],
  );
  return rows.map(mapEarning);
}

export async function insertEarning(input: {
  id: string;
  streamerId: string;
  campaignId: string;
  paymentId: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
}) {
  await query(
    `insert into earnings (id, streamer_id, campaign_id, payment_id, gross_cents, commission_cents, net_cents)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [input.id, input.streamerId, input.campaignId, input.paymentId, input.grossCents, input.commissionCents, input.netCents],
  );
}

export async function earningExists(campaignId: string, streamerId: string) {
  const row = await one(`select id from earnings where campaign_id = $1 and streamer_id = $2`, [campaignId, streamerId]);
  return Boolean(row);
}

export async function reverseUnpaidEarnings(campaignId: string) {
  await query(
    `update earnings set status = 'reversed' where campaign_id = $1 and status in ('held', 'eligible') and payout_id is null`,
    [campaignId],
  );
}

export async function unpaidEligible(streamerId: string) {
  const rows = await query(
    `select e.*, c.name as campaign_name from earnings e join campaigns c on c.id = e.campaign_id
     where e.streamer_id = $1 and e.status = 'eligible' and e.payout_id is null`,
    [streamerId],
  );
  return rows.map(mapEarning);
}

export async function insertPayout(input: { id: string; streamerId: string; amountCents: number; method: string; note: string }) {
  await query(
    `insert into payouts (id, streamer_id, amount_cents, method, note) values ($1, $2, $3, $4, $5)`,
    [input.id, input.streamerId, input.amountCents, input.method, input.note],
  );
}

export async function assignPayout(earningIds: string[], payoutId: string) {
  await query(
    `update earnings set payout_id = $2 where id = any($1::uuid[]) and status = 'eligible' and payout_id is null`,
    [earningIds, payoutId],
  );
}

export async function payoutById(id: string) {
  const row = await one(
    `select p.*, s.display_name as streamer_name from payouts p join streamers s on s.id = p.streamer_id where p.id = $1`,
    [id],
  );
  return row ? mapPayout(row) : null;
}

export async function listPayouts() {
  const rows = await query(
    `select p.*, s.display_name as streamer_name from payouts p join streamers s on s.id = p.streamer_id order by p.created_at desc limit 200`,
  );
  return rows.map(mapPayout);
}

export async function payoutsForStreamer(streamerId: string) {
  const rows = await query(
    `select p.*, s.display_name as streamer_name from payouts p join streamers s on s.id = p.streamer_id
     where p.streamer_id = $1 order by p.created_at desc`,
    [streamerId],
  );
  return rows.map(mapPayout);
}

export async function paymentByIntent(intentId: string) {
  const row = await one(`select * from payments where stripe_payment_intent_id = $1`, [intentId]);
  return row ? mapPayment(row) : null;
}

export async function setRefundedTotal(id: string, refundedCents: number) {
  await query(
    `update payments
     set refunded_cents = greatest(refunded_cents, $2),
         status = case
           when greatest(refunded_cents, $2) >= amount_cents then 'refunded'::payment_status
           else status
         end
     where id = $1`,
    [id, refundedCents],
  );
}

export async function markPayout(id: string, status: string, transferId: string | null) {
  await query(
    `update payouts set status = $2::payout_status, stripe_transfer_id = $3, paid_at = case when $2 = 'paid' then now() else paid_at end
     where id = $1`,
    [id, status, transferId],
  );
  if (status === "paid") {
    await query(`update earnings set status = 'paid' where payout_id = $1`, [id]);
  }
  if (status === "failed") {
    await query(`update earnings set payout_id = null where payout_id = $1 and status = 'eligible'`, [id]);
  }
}

export async function openDispute(input: {
  id: string;
  campaignId: string;
  paymentId: string | null;
  openedBy: string;
  reason: string;
  amountCents: number;
}) {
  await query(
    `insert into disputes (id, campaign_id, payment_id, opened_by, reason, amount_cents)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.campaignId, input.paymentId, input.openedBy, input.reason, input.amountCents],
  );
}

export async function listDisputes() {
  const rows = await query(
    `select d.*, c.name as campaign_name from disputes d join campaigns c on c.id = d.campaign_id order by d.created_at desc limit 200`,
  );
  return rows.map(mapDispute);
}

export async function disputesForCampaign(campaignId: string) {
  const rows = await query(
    `select d.*, c.name as campaign_name from disputes d join campaigns c on c.id = d.campaign_id where d.campaign_id = $1 order by d.created_at desc`,
    [campaignId],
  );
  return rows.map(mapDispute);
}

export async function disputeById(id: string) {
  const row = await one(
    `select d.*, c.name as campaign_name from disputes d join campaigns c on c.id = d.campaign_id where d.id = $1`,
    [id],
  );
  return row ? mapDispute(row) : null;
}

export async function resolveDispute(id: string, status: string, note: string) {
  await query(
    `update disputes set status = $2::dispute_status, resolution_note = $3, resolved_at = now() where id = $1`,
    [id, status, note],
  );
}

export async function insertInvite(input: { id: string; agencyId: string; code: string; email: string }) {
  await query(
    `insert into agency_invites (id, agency_id, code, email) values ($1, $2, $3, $4)`,
    [input.id, input.agencyId, input.code, input.email],
  );
}

export async function inviteByCode(code: string) {
  return one<{ id: string; agency_id: string; accepted_at: string | null }>(
    `select id, agency_id, accepted_at from agency_invites where code = $1`,
    [code],
  );
}

export async function acceptInvite(id: string, streamerId: string) {
  await query(
    `update agency_invites set accepted_at = now(), accepted_streamer_id = $2 where id = $1 and accepted_at is null`,
    [id, streamerId],
  );
}

export async function listInvites(agencyId: string) {
  return query<{ code: string; email: string; accepted_at: string | null; created_at: string }>(
    `select code, email, accepted_at, created_at from agency_invites where agency_id = $1 order by created_at desc`,
    [agencyId],
  );
}

export async function listAudit() {
  const rows = await query(
    `select a.*, u.email as actor_email from audit_logs a left join users u on u.id = a.actor_id
     order by a.created_at desc limit 200`,
  );
  return rows.map(mapAudit);
}

export async function recentPlaybackCount(streamerId: string, creativeId: string, eventType: string) {
  const row = await one<{ count: number | string }>(
    `select count(*) as count from playback_events
     where streamer_id = $1 and creative_id = $2 and event_type = $3 and played_at > now() - interval '4 seconds'`,
    [streamerId, creativeId, eventType],
  );
  return Number(row?.count ?? 0);
}

export async function playbacksLastMinute(streamerId: string) {
  const row = await one<{ count: number | string }>(
    `select count(*) as count from playback_events where streamer_id = $1 and played_at > now() - interval '1 minute'`,
    [streamerId],
  );
  return Number(row?.count ?? 0);
}

export async function insertPlayback(input: {
  id: string;
  streamerId: string;
  campaignId: string;
  creativeId: string;
  eventType: string;
  durationMs: number;
}) {
  await query(
    `insert into playback_events (id, streamer_id, campaign_id, creative_id, event_type, duration_ms)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.streamerId, input.campaignId, input.creativeId, input.eventType, input.durationMs],
  );
}

function streamerSelect(withToken: boolean) {
  const token = withToken ? "overlay_token" : "null::text as overlay_token";
  return `select ${STREAMER_FIELDS}, ${token} from streamers`;
}
