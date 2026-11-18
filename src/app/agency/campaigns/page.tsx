import Link from "next/link";
import { Badge, PageHeader, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { agencyByOwner, listCampaignsForAgency } from "@/lib/store";

export default async function AgencyCampaignsPage() {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  if (!agency) return null;
  const campaigns = await listCampaignsForAgency(agency.id);
  return (
    <div>
      <PageHeader eyebrow="Campaigns" title="Requests on the roster" />
      <table className="w-full min-w-[560px]">
        <thead>
          <tr>
            {["Campaign", "Advertiser", "Status"].map((heading) => (
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
                <Link href={`/agency/campaigns/${campaign.id}`}>{campaign.name}</Link>
              </td>
              <td className={tdClass}>{campaign.companyName}</td>
              <td className={tdClass}>
                <Badge status={campaign.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
