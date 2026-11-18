
> castline@0.1.0 db:sql
> tsx -e "import { schemaSql } from './src/lib/db/schema.ts'; process.stdout.write(schemaSql)"


do $$ begin
  create type user_role as enum ('brand', 'streamer', 'manager', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_mode as enum ('self', 'manager', 'either', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum (
    'draft', 'pending_approval', 'changes_requested', 'approved', 'payment_pending',
    'scheduled', 'active', 'completed', 'rejected', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_status as enum ('pending', 'approved', 'changes_requested', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type creative_type as enum ('image', 'gif', 'mp4');
exception when duplicate_object then null; end $$;

do $$ begin
  create type creative_status as enum ('pending_review', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type earning_status as enum ('held', 'eligible', 'paid', 'reversed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_status as enum ('pending', 'paid', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_status as enum ('open', 'resolved_refund', 'resolved_denied');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  role user_role not null,
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists agencies (
  id uuid primary key,
  owner_id uuid not null unique references users(id),
  name text not null,
  website text not null default '',
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key,
  owner_id uuid not null unique references users(id),
  company_name text not null,
  website text not null default '',
  industry text not null default 'Other',
  billing_email text not null default '',
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists streamers (
  id uuid primary key,
  owner_id uuid not null unique references users(id),
  agency_id uuid references agencies(id),
  link_status text not null default 'none' check (link_status in ('none', 'pending', 'active')),
  slug text not null unique,
  display_name text not null,
  twitch_login text not null unique,
  verification_status verification_status not null default 'pending',
  bio text not null default '',
  category text not null,
  language text not null default 'en',
  avg_ccv integer not null default 0 check (avg_ccv >= 0),
  follower_count integer not null default 0 check (follower_count >= 0),
  daily_rate_cents integer check (daily_rate_cents is null or daily_rate_cents >= 0),
  min_daily_rate_cents integer check (min_daily_rate_cents is null or min_daily_rate_cents >= 0),
  placement_size text not null default 'medium' check (placement_size in ('small', 'medium', 'large')),
  overlay_width integer not null default 1920 check (overlay_width between 320 and 3840),
  overlay_height integer not null default 1080 check (overlay_height between 180 and 2160),
  overlay_position text not null default 'bottom-right' check (overlay_position in ('bottom-right', 'bottom-left', 'top-right', 'top-left', 'center')),
  overlay_audio boolean not null default false,
  accepting_ads boolean not null default true,
  max_concurrent integer not null default 3 check (max_concurrent between 1 and 20),
  min_days integer not null default 1 check (min_days between 1 and 90),
  max_days integer not null default 30 check (max_days between 1 and 90),
  blocked_tags text[] not null default '{}',
  approval_mode approval_mode not null default 'self',
  overlay_token text,
  overlay_token_hash text unique,
  token_revoked_at timestamptz,
  public_demo boolean not null default false,
  stripe_account_id text,
  status account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_days >= min_days)
);

create table if not exists pricing_tiers (
  id uuid primary key,
  name text not null,
  min_ccv integer not null check (min_ccv >= 0),
  max_ccv integer,
  daily_rate_cents integer not null check (daily_rate_cents >= 0),
  sort_order integer not null,
  active boolean not null default true,
  check (max_ccv is null or max_ccv >= min_ccv)
);

create table if not exists platform_settings (
  id integer primary key check (id = 1),
  commission_bps integer not null default 2000 check (commission_bps between 0 and 5000),
  min_playbacks_to_release integer not null default 1 check (min_playbacks_to_release >= 0),
  exclusivity_millis integer not null default 1500 check (exclusivity_millis between 100 and 10000),
  rotation_standard_millis integer not null default 1000 check (rotation_standard_millis between 100 and 10000),
  rotation_high_millis integer not null default 1400 check (rotation_high_millis between 100 and 10000),
  rotation_max_millis integer not null default 1800 check (rotation_max_millis between 100 and 10000),
  size_small_millis integer not null default 1000 check (size_small_millis between 100 and 10000),
  size_medium_millis integer not null default 1250 check (size_medium_millis between 100 and 10000),
  size_large_millis integer not null default 1600 check (size_large_millis between 100 and 10000),
  max_image_bytes integer not null default 5242880,
  max_gif_bytes integer not null default 8388608,
  max_video_bytes integer not null default 31457280,
  max_video_seconds integer not null default 30,
  currency text not null default 'usd',
  require_brand_approval boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into platform_settings (id) values (1) on conflict (id) do nothing;

create table if not exists campaigns (
  id uuid primary key,
  brand_id uuid not null references brands(id),
  name text not null,
  status campaign_status not null default 'draft',
  vertical text not null default 'Other',
  restricted_tag text not null default '',
  destination_url text not null default '',
  brief text not null default '',
  start_date text,
  end_date text,
  budget_cents integer not null default 0 check (budget_cents >= 0),
  placement_duration_sec integer not null default 15 check (placement_duration_sec between 5 and 90),
  rotation text not null default 'standard' check (rotation in ('standard', 'high', 'max')),
  placement_size text not null default 'medium' check (placement_size in ('small', 'medium', 'large')),
  exclusivity boolean not null default false,
  admin_review text not null default 'pending' check (admin_review in ('pending', 'approved', 'rejected', 'changes_requested')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign_streamers (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  streamer_id uuid not null references streamers(id),
  status participant_status not null default 'pending',
  calculated_cents integer not null default 0,
  override_cents integer,
  rate_cents integer not null default 0,
  price_snapshot text not null default '{}',
  note text not null default '',
  streamer_decision text check (streamer_decision is null or streamer_decision in ('approved', 'rejected', 'changes_requested')),
  manager_decision text check (manager_decision is null or manager_decision in ('approved', 'rejected', 'changes_requested')),
  primary key (campaign_id, streamer_id)
);

create table if not exists creatives (
  id uuid primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type creative_type not null,
  storage_key text not null,
  original_name text not null,
  mime text not null,
  byte_size integer not null check (byte_size > 0),
  status creative_status not null default 'pending_review',
  moderation_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key,
  campaign_id uuid not null references campaigns(id),
  amount_cents integer not null check (amount_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  refunded_cents integer not null default 0 check (refunded_cents >= 0),
  currency text not null default 'usd',
  status payment_status not null default 'pending',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists payouts (
  id uuid primary key,
  streamer_id uuid not null references streamers(id),
  amount_cents integer not null check (amount_cents >= 0),
  status payout_status not null default 'pending',
  method text not null default 'manual' check (method in ('manual', 'stripe_connect')),
  stripe_transfer_id text,
  note text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists earnings (
  id uuid primary key,
  streamer_id uuid not null references streamers(id),
  campaign_id uuid not null references campaigns(id),
  payment_id uuid references payments(id),
  gross_cents integer not null,
  commission_cents integer not null,
  net_cents integer not null,
  status earning_status not null default 'held',
  payout_id uuid references payouts(id),
  created_at timestamptz not null default now(),
  eligible_at timestamptz
);

create table if not exists disputes (
  id uuid primary key,
  campaign_id uuid not null references campaigns(id),
  payment_id uuid references payments(id),
  opened_by uuid references users(id),
  reason text not null,
  status dispute_status not null default 'open',
  amount_cents integer not null default 0,
  resolution_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists disputes_one_open on disputes (campaign_id) where status = 'open';

create table if not exists playback_events (
  id uuid primary key,
  streamer_id uuid not null references streamers(id),
  campaign_id uuid not null references campaigns(id),
  creative_id uuid not null references creatives(id),
  event_type text not null check (event_type in ('started', 'completed')),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  played_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata text not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists agency_invites (
  id uuid primary key,
  agency_id uuid not null references agencies(id),
  code text not null unique,
  email text not null default '',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_streamer_id uuid references streamers(id)
);

create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists streamers_market_idx on streamers (status, verification_status, accepting_ads);
create index if not exists streamers_category_idx on streamers (category);
create index if not exists streamers_ccv_idx on streamers (avg_ccv);
create index if not exists streamers_agency_idx on streamers (agency_id);
create index if not exists campaigns_brand_idx on campaigns (brand_id, status);
create index if not exists campaigns_status_idx on campaigns (status);
create index if not exists campaign_streamers_streamer_idx on campaign_streamers (streamer_id, status);
create index if not exists creatives_campaign_idx on creatives (campaign_id, status);
create index if not exists payments_campaign_idx on payments (campaign_id, status);
create index if not exists earnings_streamer_idx on earnings (streamer_id, status);
create index if not exists playback_streamer_time_idx on playback_events (streamer_id, played_at desc);
create index if not exists playback_campaign_idx on playback_events (campaign_id, creative_id);
create index if not exists audit_time_idx on audit_logs (created_at desc);
