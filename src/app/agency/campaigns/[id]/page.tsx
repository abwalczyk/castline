import { notFound } from "next/navigation";
import { DecisionForm } from "@/components/decision-form";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { actorCanDecide } from "@/lib/approval";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { agencyByOwner, creatives, getCampaign, getSettings, participants } from "@/lib/store";

export default async function AgencyCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  const campaign = await getCampaign((await params).id);
  if (!agency || !campaign) notFound();
  const [lines, assets, settings] = await Promise.all([participants(campaign.id), creatives(campaign.id), getSettings()]);
  const mine = lines.filter((line) => line.agencyId === agency.id && line.linkStatus === "active");
  if (mine.length === 0) notFound();
  return (
    <div>
      <PageHeader eyebrow={campaign.companyName ?? "Campaign"} title={campaign.name} description={campaign.brief || "No brief."} />
      <Badge status={campaign.status} />
      <ul className="mt-4 space-y-2 text-sm">
        {assets.map((asset) => (
          <li key={asset.id}>
            <Badge status={asset.status} /> {asset.originalName}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-6">
        {mine.map((line) => (
          <Panel key={line.streamerId} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{line.displayName}</h2>
              <Badge status={line.status} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {money(line.rateCents, settings.currency)} · creator {line.streamerDecision ?? "pending"} · agency {line.managerDecision ?? "pending"} · rule {line.approvalMode}
            </p>
            {campaign.status === "pending_approval" && actorCanDecide(line.approvalMode, "manager") ? (
              <div className="mt-4 max-w-lg">
                <DecisionForm campaignId={campaign.id} streamerId={line.streamerId} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {actorCanDecide(line.approvalMode, "manager") ? "Not waiting on an agency decision." : "The creator decides this placement."}
              </p>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
