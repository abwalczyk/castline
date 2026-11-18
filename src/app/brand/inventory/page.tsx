import { startCampaign } from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { rateLabel, StreamerFilters } from "@/components/streamer-card";
import { Field, Input, PageHeader } from "@/components/ui";
import { compact } from "@/lib/format";
import { marketQuery } from "@/lib/market-query";
import { tierForCcv } from "@/lib/pricing";
import { listMarketplace, listTiers } from "@/lib/store";

export default async function InventoryPage({
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
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Choose creators"
        description="Select one or more channels, name the campaign, and you land in a draft. Prices appear after you set the flight dates."
      />
      <StreamerFilters values={query} />
      <Form action={startCampaign} className="mt-6 space-y-4">
        <Field label="Campaign name">
          <Input name="name" placeholder="Spring product flight" required />
        </Field>
        <div className="divide-y divide-line rounded-lg border border-line">
          {visible.map((streamer) => (
            <label key={streamer.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <input type="checkbox" name="streamerId" value={streamer.id} />
                <span>
                  <span className="block text-ink">{streamer.displayName}</span>
                  <span className="text-faint">
                    {streamer.category} · {compact(streamer.avgCcv)} CCV · {compact(streamer.followerCount)} followers
                  </span>
                </span>
              </span>
              <span className="tabular-nums text-accent-soft">
                {rateLabel(streamer.dailyRateCents, tierForCcv(streamer.avgCcv, tiers)?.dailyRateCents ?? null)}
              </span>
            </label>
          ))}
        </div>
        <SubmitButton>Create campaign</SubmitButton>
      </Form>
    </div>
  );
}
