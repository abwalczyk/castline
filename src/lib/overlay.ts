import "server-only";
import { randomUUID } from "node:crypto";
import { SPONSOR_LABEL } from "@/lib/constants";
import { query } from "@/lib/db";
import { destinationHost } from "@/lib/urls";
import { tick } from "@/lib/lifecycle";
import { sha256 } from "@/lib/password";
import { expandByWeight } from "@/lib/playlist";
import { rotationWeight } from "@/lib/pricing";
import type { Rotation } from "@/lib/constants";
import { num, str } from "@/lib/rows";
import {
  creativeById,
  insertPlayback,
  playbacksLastMinute,
  recentPlaybackCount,
  streamerByTokenHash,
} from "@/lib/store";
import { getObject } from "@/lib/storage";

export type ServedAd = {
  creativeId: string;
  campaignId: string;
  type: "image" | "gif" | "mp4";
  url: string;
  durationSec: number;
  destinationHost: string;
  disclosure: string;
};

export async function playlistForToken(slug: string, token: string) {
  await tick();
  const streamer = await streamerByTokenHash(sha256(token));
  if (!streamer || streamer.slug !== slug) return null;
  if (streamer.status !== "active" || streamer.verificationStatus !== "verified" || !streamer.acceptingAds) {
    return { ads: [] as ServedAd[] };
  }
  const rows = await query(
    `select cr.id as creative_id, cr.type::text as type, c.id as campaign_id, c.rotation, c.placement_duration_sec,
            c.destination_url
     from campaign_streamers cs
     join campaigns c on c.id = cs.campaign_id
     join creatives cr on cr.campaign_id = c.id
     where cs.streamer_id = $1
       and cs.status = 'approved'::participant_status
       and c.status = 'active'::campaign_status
       and cr.status = 'approved'::creative_status
       and c.start_date <= to_char(current_date, 'YYYY-MM-DD')
       and c.end_date >= to_char(current_date, 'YYYY-MM-DD')
     order by c.id, cr.created_at`,
    [streamer.id],
  );
  const weighted = rows.map((row) => ({
    weight: rotationWeight(str(row.rotation) as Rotation),
    creativeId: str(row.creative_id),
    campaignId: str(row.campaign_id),
    type: str(row.type) as ServedAd["type"],
    url: `/api/overlay/${slug}/${token}/media/${str(row.creative_id)}`,
    durationSec: num(row.placement_duration_sec),
    destinationHost: destinationHost(str(row.destination_url)),
    disclosure: SPONSOR_LABEL,
  }));
  const ads = expandByWeight(weighted).map(({ weight: _weight, ...ad }) => ad);
  return { ads };
}

export async function mediaForToken(slug: string, token: string, creativeId: string) {
  const playlist = await playlistForToken(slug, token);
  if (!playlist?.ads.some((ad) => ad.creativeId === creativeId)) return null;
  const creative = await creativeById(creativeId);
  if (!creative) return null;
  const bytes = await getObject(creative.storageKey);
  if (!bytes) return null;
  return { bytes, mime: creative.mime };
}

export async function recordPlayback(
  slug: string,
  token: string,
  input: { creativeId: string; campaignId: string; eventType: "started" | "completed"; durationMs: number },
) {
  const playlist = await playlistForToken(slug, token);
  if (!playlist) return 404;
  const match = playlist.ads.find(
    (ad) => ad.creativeId === input.creativeId && ad.campaignId === input.campaignId,
  );
  if (!match) return 404;
  const streamer = await streamerByTokenHash(sha256(token));
  if (!streamer) return 404;
  if ((await playbacksLastMinute(streamer.id)) > 120) return 429;
  if ((await recentPlaybackCount(streamer.id, input.creativeId, input.eventType)) > 0) return 204;
  await insertPlayback({
    id: randomUUID(),
    streamerId: streamer.id,
    campaignId: input.campaignId,
    creativeId: input.creativeId,
    eventType: input.eventType,
    durationMs: input.durationMs,
  });
  return 204;
}
