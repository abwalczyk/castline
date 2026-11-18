import Link from "next/link";
import { Badge, PageHeader, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { getSettings, listCampaignsForStreamer, streamerByOwner } from "@/lib/store";

export default async function StreamerCampaignsPage() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id);
  if (!streamer) return null;
  const [campaigns, settings] = await Promise.all([listCampaignsForStreamer(streamer.id), getSettings()]);
  const upcoming = campaigns.filter((campaign) => ["pending_approval", "approved", "payment_pending", "scheduled"].includes(campaign.status));
  const live = campaigns.filter((campaign) => campaign.status === "active");
  return (
    <div>
      <PageHeader eyebrow="Campaigns" title="Requests and flights" description={`${live.length} live · ${upcoming.length} upcoming or waiting.`} />
      <table className="w-full min-w-[560px]">
        <thead>
          <tr>
            {["Campaign", "Advertiser", "Status", "Line"].map((heading) => (
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
  );
}
