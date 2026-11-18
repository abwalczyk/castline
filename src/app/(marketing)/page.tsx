import Link from "next/link";
import { AdPlayer } from "@/components/player";
import { rateLabel, StreamerCard } from "@/components/streamer-card";
import { buttonClass } from "@/components/ui";
import { compact } from "@/lib/format";
import { playlistForToken } from "@/lib/overlay";
import { tierForCcv } from "@/lib/pricing";
import { listMarketplace, listTiers, publicDemo } from "@/lib/store";

export default async function HomePage() {
  const [demo, tiers, streamers] = await Promise.all([
    publicDemo(),
    listTiers(),
    listMarketplace({ category: "", minCcv: 0, maxCcv: 0, minFollowers: 0, search: "", listedOnly: true }),
  ]);
  const playlist = demo?.overlayToken ? await playlistForToken(demo.slug, demo.overlayToken) : null;

  return (
    <div>
      <section className="relative py-16 md:py-24">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Livestream advertising</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
              Sponsored placements on broadcasts you can book.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              Castline connects brands with independent creators and the agencies that represent them. A campaign is a dated flight with a budget, a creative, and a destination. Delivery is a persistent OBS browser source that rotates approved ads without the creator touching it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register/brand" className={buttonClass()}>
                Book inventory
              </Link>
              <Link href="/register/streamer" className={buttonClass("secondary")}>
                Monetize a channel
              </Link>
            </div>
          </div>
          <div className="h-[420px] overflow-hidden rounded-xl border border-line bg-black">
            {demo?.overlayToken && playlist ? (
              <AdPlayer
                ads={playlist.ads}
                playlistUrl={`/api/overlay/${demo.slug}/${demo.overlayToken}/playlist`}
                width={demo.overlayWidth}
                height={demo.overlayHeight}
                position={demo.overlayPosition}
                size={demo.placementSize}
                track={false}
                preview
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/70">
                The live browser source appears here once a creator publishes a demo placement.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
        {[
          ["01", "Book a flight", "Choose creators, dates, duration, and a destination URL. Upload a still, a GIF, or an MP4."],
          ["02", "Clear approval", "The creator or their agency decides. Castline reviews the creative before anything can run."],
          ["03", "Measure playback", "The browser source reports plays and airtime. Estimated exposure stays labeled as an estimate."],
        ].map(([index, title, body]) => (
          <article key={index} className="bg-surface p-6">
            <p className="text-xs tracking-[0.16em] text-faint">{index}</p>
            <h2 className="mt-3 font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>

      <section className="py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-faint">Inventory</p>
            <h2 className="mt-2 font-serif text-4xl">Creators accepting placements</h2>
          </div>
          <Link href="/streamers" className="text-sm text-accent-soft">
            Browse all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {streamers.slice(0, 3).map((streamer) => (
            <StreamerCard
              key={streamer.id}
              href={`/streamers/${streamer.slug}`}
              name={streamer.displayName}
              category={streamer.category}
              ccv={compact(streamer.avgCcv)}
              followers={compact(streamer.followerCount)}
              rate={rateLabel(streamer.dailyRateCents, tierForCcv(streamer.avgCcv, tiers)?.dailyRateCents ?? null)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
