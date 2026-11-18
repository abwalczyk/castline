-- Optional defense in depth for Supabase PostgREST.
-- The Castline server connects as the database owner and bypasses row-level security.
-- Enabling RLS without policies means the anon and authenticated API roles see nothing.
-- Do not add a public SELECT on streamers. overlay_token would leak.
-- Do not FORCE ROW LEVEL SECURITY unless the application role is granted explicit policies.

alter table users enable row level security;
alter table sessions enable row level security;
alter table agencies enable row level security;
alter table brands enable row level security;
alter table streamers enable row level security;
alter table pricing_tiers enable row level security;
alter table platform_settings enable row level security;
alter table campaigns enable row level security;
alter table campaign_streamers enable row level security;
alter table creatives enable row level security;
alter table payments enable row level security;
alter table payouts enable row level security;
alter table earnings enable row level security;
alter table disputes enable row level security;
alter table playback_events enable row level security;
alter table audit_logs enable row level security;
alter table agency_invites enable row level security;
