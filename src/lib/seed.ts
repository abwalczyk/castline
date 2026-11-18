import { randomUUID } from "node:crypto";
import { DEMO_PASSWORD } from "@/lib/demo";
import { one, query } from "@/lib/db";
import { labelPng } from "@/lib/label-png";
import { hashPassword, newToken, sha256 } from "@/lib/password";
import { inclusiveDays, quotePlacement } from "@/lib/pricing";
import { bool, num } from "@/lib/rows";
import { getSettings, listTiers } from "@/lib/store";
import { putObject } from "@/lib/storage";

const IDS = {
  admin: "11111111-1111-4111-8111-111111111111",
  brandUser: "22222222-2222-4222-8222-222222222222",
  agencyUser: "33333333-3333-4333-8333-333333333333",
  mayaUser: "44444444-4444-4444-8444-444444444441",
  leoUser: "44444444-4444-4444-8444-444444444442",
  noraUser: "44444444-4444-4444-8444-444444444443",
  chrisUser: "44444444-4444-4444-8444-444444444444",
  juneUser: "44444444-4444-4444-8444-444444444445",
  samUser: "44444444-4444-4444-8444-444444444446",
  priyaUser: "44444444-4444-4444-8444-444444444447",
  evanUser: "44444444-4444-4444-8444-444444444448",
  brand: "55555555-5555-4555-8555-555555555555",
  agency: "66666666-6666-4666-8666-666666666666",
  maya: "77777777-7777-4777-8777-777777777771",
  leo: "77777777-7777-4777-8777-777777777772",
  nora: "77777777-7777-4777-8777-777777777773",
  chris: "77777777-7777-4777-8777-777777777774",
  june: "77777777-7777-4777-8777-777777777775",
  sam: "77777777-7777-4777-8777-777777777776",
  priya: "77777777-7777-4777-8777-777777777777",
  evan: "77777777-7777-4777-8777-777777777778",
  mayaCampaign: "88888888-8888-4888-8888-888888888881",
  leoCampaign: "88888888-8888-4888-8888-888888888882",
  noraCampaign: "88888888-8888-4888-8888-888888888883",
  creativeA: "99999999-9999-4999-8999-999999999991",
  creativeB: "99999999-9999-4999-8999-999999999992",
  creativeLeo: "99999999-9999-4999-8999-999999999993",
  creativeNora: "99999999-9999-4999-8999-999999999994",
  payment: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  earning: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  dispute: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
};

export async function seedIfEmpty() {
  if (process.env.SEED_DEMO === "false") return;
  const row = await one<{ count: number | string }>(`select count(*) as count from users`);
  if (num(row?.count) > 0) return;
  await seed();
}

async function seed() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await user(IDS.admin, "admin@castline.dev", "Avery Cole", "admin", passwordHash);
  await user(IDS.brandUser, "brand@castline.dev", "Jordan Hale", "brand", passwordHash);
  await user(IDS.agencyUser, "agency@castline.dev", "Renee Cho", "manager", passwordHash);
  await query(
    `insert into brands (id, owner_id, company_name, website, industry, billing_email, status)
     values ($1, $2, 'Northwind Goods', 'https://northwind.example', 'Consumer goods', 'brand@castline.dev', 'active')`,
    [IDS.brand, IDS.brandUser],
  );
  await query(
    `insert into agencies (id, owner_id, name, website, status)
     values ($1, $2, 'Harbor & Co.', 'https://harbor.example', 'active')`,
    [IDS.agency, IDS.agencyUser],
  );

  const creators = [
    [IDS.mayaUser, "maya@castline.dev", "Maya Chen", IDS.maya, "maya-chen", "Maya Chen", "mayachen", "Just Chatting", 420, 18400, 18000, null, "self", null, "Long-form conversations on design, work, and city life.", true, "active", "verified"],
    [IDS.leoUser, "leo@castline.dev", "Leo Park", IDS.leo, "leo-park", "Leo Park", "leopark", "Technology", 910, 64000, null, null, "self", null, "Product teardowns and developer tools, three nights a week.", false, "active", "verified"],
    [IDS.noraUser, "nora@castline.dev", "Nora Ali", IDS.nora, "nora-ali", "Nora Ali", "noraali", "Music", 260, 22100, null, null, "manager", IDS.agency, "Evening sessions built around new records and live sets.", false, "active", "verified"],
    [IDS.chrisUser, "chris@castline.dev", "Chris Adelman", IDS.chris, "chris-adelman", "Chris Adelman", "chrisadelman", "Sports", 1500, 120000, null, 70000, "both", IDS.agency, "Match-night desk for leagues, tactics, and the business of sport.", false, "active", "verified"],
    [IDS.juneUser, "june@castline.dev", "June Ito", IDS.june, "june-ito", "June Ito", "juneito", "Art", 80, 5400, null, null, "self", null, "Studio hours: illustration, process, and commissioned work.", false, "active", "verified"],
    [IDS.samUser, "sam@castline.dev", "Sam Okonkwo", IDS.sam, "sam-okonkwo", "Sam Okonkwo", "samokonkwo", "IRL", 2200, 210000, null, null, "self", null, "City walks and live interviews with independent businesses.", false, "active", "verified"],
    [IDS.priyaUser, "priya@castline.dev", "Priya Shah", IDS.priya, "priya-shah", "Priya Shah", "priyashah", "Food", 140, 9000, null, null, "self", null, "Weeknight cooking for people who shop on the way home.", false, "pending", "pending"],
    [IDS.evanUser, "evan@castline.dev", "Evan Brooks", IDS.evan, "evan-brooks", "Evan Brooks", "evanbrooks", "News", 540, 41000, null, null, "self", null, "A calm evening briefing on markets, policy, and culture.", false, "active", "verified"],
  ] as const;

  for (const creator of creators) {
    await user(creator[0], creator[1], creator[2], "streamer", passwordHash);
    const token = newToken();
    await query(
      `insert into streamers (
        id, owner_id, agency_id, link_status, slug, display_name, twitch_login, bio, category,
        avg_ccv, follower_count, daily_rate_cents, min_daily_rate_cents, approval_mode,
        overlay_token, overlay_token_hash, public_demo, status, verification_status, blocked_tags
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14::approval_mode,
        $15, $16, $17, $18::account_status, $19::verification_status, $20
      )`,
      [
        creator[3],
        creator[0],
        creator[13],
        creator[13] ? "active" : "none",
        creator[4],
        creator[5],
        creator[6],
        creator[14],
        creator[7],
        creator[8],
        creator[9],
        creator[10],
        creator[11],
        creator[12],
        token,
        sha256(token),
        creator[15],
        creator[16],
        creator[17],
        creator[3] === IDS.evan ? ["Alcohol", "Gambling", "Crypto"] : [],
      ],
    );
  }

  await query(
    `insert into pricing_tiers (id, name, min_ccv, max_ccv, daily_rate_cents, sort_order) values
     ('d1111111-1111-4111-8111-111111111111', 'Emerging', 0, 49, 4000, 1),
     ('d2222222-2222-4222-8222-222222222222', 'Growth', 50, 249, 9000, 2),
     ('d3333333-3333-4333-8333-333333333333', 'Established', 250, 999, 22000, 3),
     ('d4444444-4444-4444-8444-444444444444', 'Scale', 1000, 4999, 60000, 4),
     ('d5555555-5555-4555-8555-555555555555', 'Premier', 5000, null, 140000, 5)`,
  );
  await query(
    `insert into agency_invites (id, agency_id, code, email) values ($1, $2, 'HARBOR7K', '')`,
    ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1", IDS.agency],
  );

  await campaign({
    id: IDS.mayaCampaign,
    name: "Northwind kettle",
    status: "active",
    vertical: "Consumer goods",
    url: "https://northwind.example/kettle",
    startSql: "to_char((current_date - 1), 'YYYY-MM-DD')",
    endSql: "to_char((current_date + 6), 'YYYY-MM-DD')",
    rotation: "standard",
    duration: 15,
    exclusivity: false,
    admin: "approved",
    streamerId: IDS.maya,
    decision: "approved",
  });
  await campaign({
    id: IDS.leoCampaign,
    name: "Tooling trial",
    status: "pending_approval",
    vertical: "Software",
    url: "https://northwind.example/tools",
    startSql: "to_char((current_date + 3), 'YYYY-MM-DD')",
    endSql: "to_char((current_date + 9), 'YYYY-MM-DD')",
    rotation: "high",
    duration: 15,
    exclusivity: false,
    admin: "pending",
    streamerId: IDS.leo,
    decision: null,
  });
  await campaign({
    id: IDS.noraCampaign,
    name: "Evening record",
    status: "pending_approval",
    vertical: "Entertainment",
    url: "https://northwind.example/radio",
    startSql: "to_char((current_date + 5), 'YYYY-MM-DD')",
    endSql: "to_char((current_date + 11), 'YYYY-MM-DD')",
    rotation: "standard",
    duration: 30,
    exclusivity: true,
    admin: "approved",
    streamerId: IDS.nora,
    decision: null,
  });

  await pricedCreative(IDS.creativeA, IDS.mayaCampaign, "NORTHWIND", [28, 24, 18], [215, 163, 90], "approved");
  await pricedCreative(IDS.creativeB, IDS.mayaCampaign, "SHOP THE DROP", [20, 28, 32], [244, 241, 234], "approved");
  await pricedCreative(IDS.creativeLeo, IDS.leoCampaign, "TOOLING TRIAL", [18, 22, 28], [214, 196, 160], "pending_review");
  await pricedCreative(IDS.creativeNora, IDS.noraCampaign, "EVENING RECORD", [36, 24, 28], [240, 220, 190], "approved");

  const payment = await lineTotal(IDS.mayaCampaign, IDS.maya);
  await query(
    `insert into payments (id, campaign_id, amount_cents, commission_cents, currency, status, paid_at)
     values ($1, $2, $3, $4, 'usd', 'paid', now())`,
    [IDS.payment, IDS.mayaCampaign, payment.gross, payment.commission],
  );
  await query(
    `insert into earnings (id, streamer_id, campaign_id, payment_id, gross_cents, commission_cents, net_cents, status)
     values ($1, $2, $3, $4, $5, $6, $7, 'held')`,
    [IDS.earning, IDS.maya, IDS.mayaCampaign, IDS.payment, payment.gross, payment.commission, payment.net],
  );
  await query(
    `insert into disputes (id, campaign_id, payment_id, opened_by, reason, amount_cents)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      IDS.dispute,
      IDS.mayaCampaign,
      IDS.payment,
      IDS.brandUser,
      "Playback count is far below the schedule we bought. Please review delivery before releasing earnings.",
      payment.gross,
    ],
  );
  for (let hour = 1; hour <= 8; hour += 1) {
    await query(
      `insert into playback_events (id, streamer_id, campaign_id, creative_id, event_type, duration_ms, played_at)
       values ($1, $2, $3, $4, 'started', 0, now() - ($5 || ' hours')::interval),
              ($6, $2, $3, $4, 'completed', 15000, now() - ($5 || ' hours')::interval + interval '15 seconds')`,
      [randomUUID(), IDS.maya, IDS.mayaCampaign, hour % 2 === 0 ? IDS.creativeA : IDS.creativeB, String(hour), randomUUID()],
    );
  }
}

async function user(id: string, email: string, name: string, role: string, passwordHash: string) {
  await query(
    `insert into users (id, email, password_hash, name, role, status) values ($1, $2, $3, $4, $5::user_role, 'active')`,
    [id, email, passwordHash, name, role],
  );
}

async function campaign(input: {
  id: string;
  name: string;
  status: string;
  vertical: string;
  url: string;
  startSql: string;
  endSql: string;
  rotation: string;
  duration: number;
  exclusivity: boolean;
  admin: string;
  streamerId: string;
  decision: string | null;
}) {
  await query(
    `insert into campaigns (
      id, brand_id, name, status, vertical, destination_url, brief, start_date, end_date,
      placement_duration_sec, rotation, placement_size, exclusivity, admin_review, budget_cents
    ) values (
      $1, $2, $3, $4::campaign_status, $5, $6, 'Demo campaign seeded for the local workspace.',
      ${input.startSql}, ${input.endSql}, $7, $8, 'medium', $9, $10, 0
    )`,
    [input.id, IDS.brand, input.name, input.status, input.vertical, input.url, input.duration, input.rotation, input.exclusivity, input.admin],
  );
  const priced = await lineTotal(input.id, input.streamerId);
  await query(
    `insert into campaign_streamers (
      campaign_id, streamer_id, status, calculated_cents, rate_cents, price_snapshot, streamer_decision
    ) values ($1, $2, $3::participant_status, $4, $4, $5, $6)`,
    [
      input.id,
      input.streamerId,
      input.decision === "approved" ? "approved" : "pending",
      priced.gross,
      JSON.stringify(priced.quote),
      input.decision,
    ],
  );
  await query(`update campaigns set budget_cents = $2 where id = $1`, [input.id, priced.gross]);
}

async function lineTotal(campaignId: string, streamerId: string) {
  const campaign = await one(
    `select start_date, end_date, rotation, placement_size, exclusivity from campaigns where id = $1`,
    [campaignId],
  );
  const streamer = await one(
    `select avg_ccv, daily_rate_cents, min_daily_rate_cents from streamers where id = $1`,
    [streamerId],
  );
  const days = inclusiveDays(String(campaign?.start_date), String(campaign?.end_date));
  const settings = await getSettings();
  const tiers = await listTiers();
  if (!days || !streamer) throw new Error("Seed campaign could not be priced.");
  const quote = quotePlacement({
    ccv: num(streamer.avg_ccv),
    days,
    askingDailyCents: streamer.daily_rate_cents == null ? null : num(streamer.daily_rate_cents),
    floorDailyCents: streamer.min_daily_rate_cents == null ? null : num(streamer.min_daily_rate_cents),
    size: "medium",
    rotation: String(campaign?.rotation) as "standard" | "high" | "max",
    exclusivity: bool(campaign?.exclusivity),
    tiers: tiers.map((tier) => ({
      name: tier.name,
      minCcv: tier.minCcv,
      maxCcv: tier.maxCcv,
      dailyRateCents: tier.dailyRateCents,
      active: tier.active,
    })),
    settings,
  });
  if (!quote) throw new Error("Seed quote was empty.");
  return { gross: quote.grossCents, commission: quote.commissionCents, net: quote.netCents, quote };
}

async function pricedCreative(
  id: string,
  campaignId: string,
  label: string,
  background: [number, number, number],
  foreground: [number, number, number],
  status: string,
) {
  const bytes = labelPng(640, 180, background, foreground, label);
  const key = `creatives/${campaignId}/${id}.png`;
  await putObject(key, bytes, "image/png");
  await query(
    `insert into creatives (id, campaign_id, type, storage_key, original_name, mime, byte_size, status)
     values ($1, $2, 'image', $3, $4, 'image/png', $5, $6::creative_status)`,
    [id, campaignId, key, `${label}.png`, bytes.byteLength, status],
  );
}
