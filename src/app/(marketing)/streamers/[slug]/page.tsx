import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass, Panel } from "@/components/ui";
import { LANGUAGES, RESTRICTED_TAGS } from "@/lib/constants";
import { compact, money } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { tierForCcv } from "@/lib/pricing";
import { getSettings, listTiers, streamerBySlug } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const streamer = await streamerBySlug((await params).slug);
  return { title: streamer?.displayName ?? "Creator" };
}

export default async function StreamerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const streamer = await streamerBySlug((await params).slug);
  if (!streamer || streamer.status !== "active" || streamer.verificationStatus !== "verified") notFound();
  const [tiers, settings, user] = await Promise.all([listTiers(), getSettings(), getCurrentUser()]);
  const tier = tierForCcv(streamer.avgCcv, tiers);
  const language = LANGUAGES.find(([code]) => code === streamer.language)?.[1] ?? streamer.language;
  const bookHref =
    user?.role === "brand" ? `/brand/campaigns/new?streamer=${streamer.id}` : "/register/brand";

  return (
    <article className="py-14">
      <p className="text-xs uppercase tracking-[0.16em] text-faint">{streamer.category}</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">{streamer.displayName}</h1>
      <p className="mt-2 text-sm text-muted">twitch.tv/{streamer.twitchLogin}</p>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">{streamer.bio || "This creator has not written a channel description yet."}</p>
      <div className="mt-8 grid gap-3 md:grid-cols-4">
        {[
          ["Average CCV", compact(streamer.avgCcv)],
          ["Followers", compact(streamer.followerCount)],
          ["Language", language],
          ["Daily rate", streamer.dailyRateCents != null ? money(streamer.dailyRateCents, settings.currency) : tier ? `${money(tier.dailyRateCents, settings.currency)} tier` : "—"],
        ].map(([label, value]) => (
          <Panel key={label} className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-faint">{label}</p>
            <p className="mt-2 text-lg">{value}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-4 p-5 text-sm leading-6 text-muted">
        <p>Flights of {streamer.minDays}–{streamer.maxDays} days. Default placement size is {streamer.placementSize}. Up to {streamer.maxConcurrent} concurrent campaigns.</p>
        <p className="mt-2">
          Declines: {RESTRICTED_TAGS.filter((tag) => streamer.blockedTags.includes(tag)).join(", ") || "no restricted categories"}.
        </p>
        <p className="mt-2">{streamer.acceptingAds ? "Currently accepting placements." : "Not accepting new placements."}</p>
      </Panel>
      <Link href={bookHref} className={`${buttonClass()} mt-6`}>
        {user?.role === "brand" ? "Start a campaign" : "Book as an advertiser"}
      </Link>
    </article>
  );
}
