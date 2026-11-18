# Castline

Self-serve marketplace for sponsored placements on livestream broadcasts. Brands book a dated flight. Creators deliver it through one persistent OBS browser source. Playback recorded by that source is kept separate from estimated audience.

## Local run

```bash
npm install
npm run dev
```

With no `DATABASE_URL`, the app uses a file-backed Postgres-compatible database in `data/pglite` and stores uploads in `data/uploads`. The first request creates the schema and, outside production, loads the sample workspace.

Demo password for every sample account: `CastlineDemo!2026`

| Role | Email |
| --- | --- |
| Advertiser | brand@castline.dev |
| Creator | maya@castline.dev |
| Agency | agency@castline.dev |
| Administrator | admin@castline.dev |

`npm test` runs the pricing, approval, and upload checks. `npm run db:sql` prints the schema.

## What is wired

- Advertiser, creator, agency, and administrator workspaces, with server-side role checks.
- Campaign drafts, roster quotes, creative upload, approval, and the status path from draft through payment.
- A browser-source player at `/overlay/{slug}/{token}` that polls a playlist, rotates images, GIFs, and MP4s, and posts playback events.
- Editable pricing tiers and commission. Commission is taken from the creator and is not added to the brand total.
- Stripe Checkout when `STRIPE_SECRET_KEY` is set. Without it, and only outside production, checkout can record a simulated payment.
- Earnings stay held until the campaign has ended and the completed-playback minimum is met. Payouts are recorded manually unless `STRIPE_CONNECT=true`.
- Optional Supabase Storage when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. Optional Twitch OAuth for channel verification.

Sign-in is an application session stored in Postgres. It is not Supabase Auth. The service role key is read only on the server.

## Production

Set `DATABASE_URL` to the Supabase Postgres connection string. The app refuses to boot on Vercel without it. Apply `supabase/migrations/0001_init.sql`. `0002_rls.sql` turns on row-level security with no policies: the server connects as the database owner and bypasses it, and the anon key sees nothing. Do not add a public read of `streamers`. That table holds browser-source tokens.

Set `SEED_DEMO=false`. Set `NEXT_PUBLIC_APP_URL` to the public origin. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and point Stripe at `/api/stripe/webhook`. Schedule `GET /api/cron/tick` with `Authorization: Bearer $CRON_SECRET` so ended flights complete and eligible earnings release even when nobody is signed in.

## Playback and exposure

A playback event means the browser source started or finished a creative. It is not a verified impression. Estimated exposure is the creator's stated average concurrent viewers multiplied by completed playback time, and the reports name it as an estimate. The marketing-site embed of a demo source does not record playback.

Creator earnings are not payable from a playback count alone. The flight has to end, and the completed-playback minimum has to be met.
