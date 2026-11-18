import Link from "next/link";
import { notFound } from "next/navigation";
import { startCampaign } from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Panel } from "@/components/ui";
import { compact, money } from "@/lib/format";
import { tierForCcv } from "@/lib/pricing";
import { getSettings, listTiers, streamerBySlug } from "@/lib/store";

export default async function InventoryProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const streamer = await streamerBySlug((await params).slug);
  if (!streamer || streamer.verificationStatus !== "verified" || streamer.status !== "active") notFound();
  const [tiers, settings] = await Promise.all([listTiers(), getSettings()]);
  const tier = tierForCcv(streamer.avgCcv, tiers);
  return (
    <div>
      <PageHeader
        eyebrow={streamer.category}
        title={streamer.displayName}
        description={streamer.bio || "No channel description yet."}
        action={
          <Link href="/brand/inventory" className="text-sm text-muted">
            Back to inventory
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Panel className="p-4 text-sm">
          <p className="text-faint">Average CCV</p>
          <p className="mt-1 text-lg">{compact(streamer.avgCcv)}</p>
        </Panel>
        <Panel className="p-4 text-sm">
          <p className="text-faint">Followers</p>
          <p className="mt-1 text-lg">{compact(streamer.followerCount)}</p>
        </Panel>
        <Panel className="p-4 text-sm">
          <p className="text-faint">Daily rate</p>
          <p className="mt-1 text-lg">
            {streamer.dailyRateCents != null
              ? money(streamer.dailyRateCents, settings.currency)
              : tier
                ? `${money(tier.dailyRateCents, settings.currency)} tier`
                : "—"}
          </p>
        </Panel>
      </div>
      <Panel className="mt-4 p-5 text-sm leading-6 text-muted">
        Flights of {streamer.minDays}–{streamer.maxDays} days. Blocked categories: {streamer.blockedTags.join(", ") || "none"}.{" "}
        {streamer.acceptingAds ? "Accepting placements." : "Not accepting placements."}
      </Panel>
      {streamer.acceptingAds ? (
        <Form action={startCampaign} className="mt-6 max-w-md space-y-4">
          <input type="hidden" name="streamerId" value={streamer.id} />
          <Field label="Campaign name">
            <Input name="name" required />
          </Field>
          <SubmitButton>Start a campaign with this creator</SubmitButton>
        </Form>
      ) : null}
    </div>
  );
}
