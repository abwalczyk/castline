import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, buttonClass, PageHeader, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { brandByOwner, getSettings, listCampaignsForBrand } from "@/lib/store";

export default async function CampaignsPage() {
  const user = await requireRole("brand");
  const brand = await brandByOwner(user.id);
  if (!brand) redirect("/brand");
  const [campaigns, settings] = await Promise.all([listCampaignsForBrand(brand.id), getSettings()]);
  return (
    <div>
      <PageHeader
        eyebrow="Campaigns"
        title="Flights"
        action={
          <Link href="/brand/campaigns/new" className={buttonClass()}>
            New campaign
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr>
              {["Name", "Status", "Review", "Creators", "Total", "Dates"].map((heading) => (
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
                  <Link href={`/brand/campaigns/${campaign.id}`}>{campaign.name}</Link>
                </td>
                <td className={tdClass}>
                  <Badge status={campaign.status} />
                </td>
                <td className={tdClass}>
                  <Badge status={campaign.adminReview} />
                </td>
                <td className={tdClass}>{campaign.streamerCount ?? 0}</td>
                <td className={tdClass}>{money(campaign.quoteCents ?? 0, settings.currency)}</td>
                <td className={tdClass}>
                  {campaign.startDate && campaign.endDate ? `${campaign.startDate} → ${campaign.endDate}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
