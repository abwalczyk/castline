import Link from "next/link";
import { Badge, buttonClass, PageHeader, Stat, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { earningTotals } from "@/lib/reports";
import { getSettings, listCampaignsForStreamer, streamerByOwner } from "@/lib/store";

export default async function StreamerHome() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id, true);
  if (!streamer) return null;
  const [campaigns, totals, settings] = await Promise.all([
    listCampaignsForStreamer(streamer.id),
    earningTotals([streamer.id]),
    getSettings(),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title={streamer.displayName}
        description="Approve flights, keep the browser source in OBS, and earnings stay held until the flight has ended and the playback minimum is met."
        action={
          <Link href="/streamer/overlay" className={buttonClass()}>
            OBS setup
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge status={streamer.verificationStatus} />
        <Badge status={streamer.status} />
        {streamer.acceptingAds ? <Badge status="active">Accepting ads</Badge> : <Badge>Paused</Badge>}
      </div>
      {streamer.verificationStatus !== "verified" ? (
        <p className="mb-6 text-sm leading-6 text-muted">
          This channel is not on the marketplace yet. An administrator verifies it, or you can connect Twitch from the channel page when OAuth is configured.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Held" value={money(totals.held, settings.currency)} detail="Waiting on the end of the flight and completed playbacks." />
        <Stat label="Eligible" value={money(totals.eligible, settings.currency)} detail="Ready for a payout. Not sent automatically." />
        <Stat label="Paid out" value={money(totals.paid, settings.currency)} />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr>
              {["Campaign", "Advertiser", "Status", "Your line"].map((heading) => (
                <th key={heading} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className={tdClass}>
                  <Link href={`/streamer/campaigns/${campaign.id}`}>{campaign.name}</Link>
                </td>
                <td className={tdClass}>{campaign.companyName}</td>
                <td className={tdClass}>
                  <Badge status={campaign.status} />
                </td>
                <td className={tdClass}>{money(campaign.quoteCents ?? 0, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
