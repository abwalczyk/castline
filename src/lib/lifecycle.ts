import "server-only";
import { cache } from "react";
import { ready, query } from "@/lib/db";
import { getSettings } from "@/lib/store";

export const tick = cache(async () => {
  await ready();
  await query(`delete from sessions where expires_at < now()`);
  await query(
    `update campaigns
     set status = 'completed', updated_at = now()
     where status in ('scheduled'::campaign_status, 'active'::campaign_status)
       and end_date is not null
       and end_date < to_char(current_date, 'YYYY-MM-DD')`,
  );
  await query(
    `update campaigns
     set status = 'active', updated_at = now()
     where status = 'scheduled'::campaign_status
       and start_date is not null
       and end_date is not null
       and start_date <= to_char(current_date, 'YYYY-MM-DD')
       and end_date >= to_char(current_date, 'YYYY-MM-DD')`,
  );
  const settings = await getSettings();
  await query(
    `update earnings e
     set status = 'eligible', eligible_at = coalesce(e.eligible_at, now())
     where e.status = 'held'
       and exists (
         select 1 from campaigns c
         where c.id = e.campaign_id and c.status = 'completed'::campaign_status
       )
       and (
         select count(*) from playback_events p
         where p.campaign_id = e.campaign_id
           and p.streamer_id = e.streamer_id
           and p.event_type = 'completed'
       ) >= $1`,
    [settings.minPlaybacksToRelease],
  );
});
