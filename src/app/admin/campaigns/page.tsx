import Link from "next/link";
import { Badge, PageHeader, tdClass, thClass } from "@/components/ui";
import { money } from "@/lib/format";
import { getSettings, listCampaignsAdmin } from "@/lib/store";

export default async function AdminCampaignsPage() {
  const [campaigns, settings] = await Promise.all([listCampaignsAdmin(), getSettings()]);
  return (
    <div>
      <PageHeader eyebrow="Moderation" title="Campaigns" />
      <table className="w-full min-w-[720px]">
        <thead>
          <tr>
            {["Campaign", "Advertiser", "Status", "Review", "Total"].map((heading) => (
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
                <Link href={`/admin/campaigns/${campaign.id}`}>{campaign.name}</Link>
              </td>
              <td className={tdClass}>{campaign.companyName}</td>
              <td className={tdClass}>
                <Badge status={campaign.status} />
              </td>
              <td className={tdClass}>
                <Badge status={campaign.adminReview} />
              </td>
              <td className={tdClass}>{money(campaign.quoteCents ?? 0, settings.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
