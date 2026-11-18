import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdPlayer } from "@/components/player";
import { PLACEMENT_SIZES, POSITIONS } from "@/lib/constants";
import { playlistForToken } from "@/lib/overlay";
import { sha256 } from "@/lib/password";
import { streamerByTokenHash } from "@/lib/store";

export const metadata: Metadata = {
  title: "Browser source",
  robots: { index: false, follow: false },
};

function integerParam(value: string | string[] | undefined, fallback: number, min: number, max: number) {
  const raw = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(raw) || raw < min || raw > max) return fallback;
  return raw;
}

export default async function OverlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, token } = await params;
  if (slug.length > 80 || token.length > 200) notFound();
  const streamer = await streamerByTokenHash(sha256(token));
  if (!streamer || streamer.slug !== slug) notFound();
  const query = await searchParams;
  const width = integerParam(query.w, streamer.overlayWidth, 320, 3840);
  const height = integerParam(query.h, streamer.overlayHeight, 180, 2160);
  const position = typeof query.pos === "string" && (POSITIONS as readonly string[]).includes(query.pos) ? query.pos : streamer.overlayPosition;
  const size = typeof query.size === "string" && (PLACEMENT_SIZES as readonly string[]).includes(query.size) ? query.size : streamer.placementSize;
  const audio = query.audio === "1" ? true : query.audio === "0" ? false : streamer.overlayAudio;
  const playlist = await playlistForToken(slug, token);
  return (
    <main className="fixed inset-0 bg-transparent">
      <AdPlayer
        ads={playlist?.ads ?? []}
        playlistUrl={`/api/overlay/${slug}/${token}/playlist`}
        eventUrl={`/api/overlay/${slug}/${token}/events`}
        width={width}
        height={height}
        position={position}
        size={size}
        audio={audio}
      />
    </main>
  );
}
