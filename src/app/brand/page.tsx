import Link from "next/link";
import { Badge, buttonClass, Empty, PageHeader, Stat, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { brandByOwner, getSettings, listCampaignsForBrand } from "@/lib/store";

export default async function BrandHome() {
  const user = await requireRole("brand");
  const brand = await brandByOwner(user.id);
  if (!brand) return <Empty title="Profile missing" body="The advertiser profile for this account was not found." />;
  const [campaigns, settings] = await Promise.all([listCampaignsForBrand(brand.id), getSettings()]);
  const active = campaigns.filter((campaign) => campaign.status === "active" || campaign.status === "scheduled").length;
  const spend = campaigns
    .filter((campaign) => ["scheduled", "active", "completed"].includes(campaign.status))
    .reduce((sum, campaign) => sum + (campaign.quoteCents ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Advertiser"
        title={brand.companyName}
        description="Create a flight, send it for approval, and pay once the creative and the roster have cleared."
        action={
          <Link href="/brand/campaigns/new" className={buttonClass()}>
            New campaign
          </Link>
        }
      />
      {brand.status !== "active" ? (
        <p className="mb-6 rounded-md border border-warn/40 px-3 py-2 text-sm text-warn">
          This advertiser profile is {brand.status}. Campaigns stay locked until an administrator activates it.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Campaigns" value={String(campaigns.length)} />
        <Stat label="Scheduled or live" value={String(active)} />
        <Stat label="Paid placements" value={money(spend, settings.currency)} detail="Sum of charged lines on paid flights." />
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              {["Campaign", "Status", "Creators", "Charged", "Flight"].map((heading) => (
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
                  <Link href={`/brand/campaigns/${campaign.id}`} className="text-ink hover:text-accent-soft">
                    {campaign.name}
                  </Link>
                </td>
                <td className={tdClass}>
                  <Badge status={campaign.status} />
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
      {campaigns.length === 0 ? (
        <div className="mt-4">
          <Empty title="No campaigns yet" body="Browse inventory and start a draft. Nothing is charged until you pay an approved flight." />
        </div>
      ) : null}
    </div>
  );
}
