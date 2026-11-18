import type { Metadata } from "next";
import { rateLabel, StreamerCard, StreamerFilters } from "@/components/streamer-card";
import { Empty } from "@/components/ui";
import { compact } from "@/lib/format";
import { marketQuery } from "@/lib/market-query";
import { tierForCcv } from "@/lib/pricing";
import { listMarketplace, listTiers } from "@/lib/store";

export const metadata: Metadata = { title: "Inventory" };

export default async function StreamersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = marketQuery(await searchParams);
  const [streamers, tiers] = await Promise.all([
    listMarketplace({
      category: query.category,
      minCcv: query.minCcv,
      maxCcv: 0,
      minFollowers: query.minFollowers,
      search: query.search,
      listedOnly: true,
    }),
    listTiers(),
  ]);
  const visible = streamers.filter((streamer) => {
    if (query.maxPriceCents == null) return true;
    const daily = streamer.dailyRateCents ?? tierForCcv(streamer.avgCcv, tiers)?.dailyRateCents ?? null;
    return daily != null && daily <= query.maxPriceCents;
  });

  return (
    <div className="py-14">
      <p className="text-xs uppercase tracking-[0.16em] text-faint">Marketplace</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">Browse participating creators</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Filters use the creator&apos;s stated average concurrent viewers, audience size, category, and daily rate. A blank asking rate falls back to the platform tier for that audience.
      </p>
      <div className="mt-8">
        <StreamerFilters values={query} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {visible.map((streamer) => (
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
      {visible.length === 0 ? (
        <div className="mt-6">
          <Empty title="No creators match" body="Widen the audience, category, or price filter." />
        </div>
      ) : null}
    </div>
  );
}
