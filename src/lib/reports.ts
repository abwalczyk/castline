import "server-only";
import { one, query } from "@/lib/db";
import { num, str } from "@/lib/rows";

export async function platformTotals() {
  const row = await one(
    `select
       coalesce(sum(amount_cents) filter (where status = 'paid'::payment_status), 0) as paid,
       coalesce(sum(commission_cents) filter (where status = 'paid'::payment_status), 0) as commission,
       coalesce(sum(refunded_cents), 0) as refunded,
       count(*) filter (where status = 'paid') as payments
     from payments`,
  );
  const campaigns = await one(
    `select
       count(*) filter (where status = 'active'::campaign_status) as active,
       count(*) filter (where status = 'pending_approval'::campaign_status) as pending,
       count(*) filter (where status in ('scheduled'::campaign_status, 'active'::campaign_status)) as delivering
     from campaigns`,
  );
  const queues = await one(
    `select
       (select count(*) from creatives where status = 'pending_review') as creatives,
       (select count(*) from disputes where status = 'open') as disputes,
       (select count(*) from streamers where verification_status = 'pending') as verifications`,
  );
  return {
    paidCents: num(row?.paid),
    commissionCents: num(row?.commission),
    refundedCents: num(row?.refunded),
    payments: num(row?.payments),
    activeCampaigns: num(campaigns?.active),
    pendingCampaigns: num(campaigns?.pending),
    delivering: num(campaigns?.delivering),
    pendingCreatives: num(queues?.creatives),
    openDisputes: num(queues?.disputes),
    pendingVerifications: num(queues?.verifications),
  };
}

export async function monthlyRevenue() {
  const rows = await query(
    `select to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
            sum(amount_cents) as paid,
            sum(commission_cents) as commission
     from payments
     where status = 'paid'::payment_status and paid_at is not null
     group by 1
     order by 1 desc`,
  );
  return rows.map((row) => ({
    month: str(row.month),
    paidCents: num(row.paid),
    commissionCents: num(row.commission),
  }));
}

export async function campaignPlayback(campaignId: string) {
  const rows = await query(
    `select s.id as streamer_id, s.display_name, s.avg_ccv, cr.id as creative_id, cr.original_name,
            count(*) filter (where p.event_type = 'completed') as playbacks,
            count(*) filter (where p.event_type = 'started') as starts,
            coalesce(sum(p.duration_ms) filter (where p.event_type = 'completed'), 0) as duration_ms
     from playback_events p
     join streamers s on s.id = p.streamer_id
     join creatives cr on cr.id = p.creative_id
     where p.campaign_id = $1
     group by s.id, s.display_name, s.avg_ccv, cr.id, cr.original_name
     order by s.display_name, cr.original_name`,
    [campaignId],
  );
  return rows.map(mapPlayback);
}

export async function streamerPlayback(streamerId: string) {
  const rows = await query(
    `select s.id as streamer_id, s.display_name, s.avg_ccv, cr.id as creative_id, cr.original_name,
            c.name as campaign_name,
            count(*) filter (where p.event_type = 'completed') as playbacks,
            count(*) filter (where p.event_type = 'started') as starts,
            coalesce(sum(p.duration_ms) filter (where p.event_type = 'completed'), 0) as duration_ms
     from playback_events p
     join streamers s on s.id = p.streamer_id
     join creatives cr on cr.id = p.creative_id
     join campaigns c on c.id = p.campaign_id
     where p.streamer_id = $1
     group by s.id, s.display_name, s.avg_ccv, cr.id, cr.original_name, c.name
     order by c.name`,
    [streamerId],
  );
  return rows.map((row) => ({ ...mapPlayback(row), campaignName: str(row.campaign_name) }));
}

export async function deliveryMonitor() {
  const rows = await query(
    `select c.id as campaign_id, c.name as campaign_name, c.status::text as status, s.display_name, s.slug,
            (select max(played_at) from playback_events p where p.campaign_id = c.id and p.streamer_id = s.id) as last_playback,
            (select count(*) from playback_events p where p.campaign_id = c.id and p.streamer_id = s.id and p.event_type = 'completed') as playbacks
     from campaigns c
     join campaign_streamers cs on cs.campaign_id = c.id
     join streamers s on s.id = cs.streamer_id
     where c.status in ('scheduled'::campaign_status, 'active'::campaign_status)
     order by c.name, s.display_name`,
  );
  return rows.map((row) => ({
    campaignId: str(row.campaign_id),
    campaignName: str(row.campaign_name),
    status: str(row.status),
    streamerName: str(row.display_name),
    slug: str(row.slug),
    lastPlayback: row.last_playback ? str(row.last_playback) : null,
    playbacks: num(row.playbacks),
  }));
}

export async function earningTotals(streamerIds: string[]) {
  if (streamerIds.length === 0) return { held: 0, eligible: 0, paid: 0 };
  const row = await one(
    `select
       coalesce(sum(net_cents) filter (where status = 'held'), 0) as held,
       coalesce(sum(net_cents) filter (where status = 'eligible'), 0) as eligible,
       coalesce(sum(net_cents) filter (where status = 'paid'), 0) as paid
     from earnings where streamer_id = any($1::uuid[])`,
    [streamerIds],
  );
  return { held: num(row?.held), eligible: num(row?.eligible), paid: num(row?.paid) };
}

export function estimatedViewerHours(avgCcv: number, durationMs: number) {
  return (avgCcv * durationMs) / 1000 / 3600;
}

export async function earningBalances() {
  const rows = await query(
    `select s.id, s.display_name,
            coalesce(sum(e.net_cents) filter (where e.status = 'held'), 0) as held,
            coalesce(sum(e.net_cents) filter (where e.status = 'eligible' and e.payout_id is null), 0) as eligible,
            coalesce(sum(e.net_cents) filter (where e.status = 'paid'), 0) as paid
     from earnings e
     join streamers s on s.id = e.streamer_id
     group by s.id, s.display_name
     order by s.display_name`,
  );
  return rows.map((row) => ({
    streamerId: str(row.id),
    streamerName: str(row.display_name),
    heldCents: num(row.held),
    eligibleCents: num(row.eligible),
    paidCents: num(row.paid),
  }));
}

function mapPlayback(row: Record<string, unknown>) {
  const durationMs = num(row.duration_ms);
  const avgCcv = num(row.avg_ccv);
  return {
    streamerId: str(row.streamer_id),
    streamerName: str(row.display_name),
    creativeId: str(row.creative_id),
    creativeName: str(row.original_name),
    playbacks: num(row.playbacks),
    starts: num(row.starts),
    durationMs,
    estimatedViewerHours: estimatedViewerHours(avgCcv, durationMs),
  };
}
