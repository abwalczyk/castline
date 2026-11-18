import { notFound } from "next/navigation";
import { DecisionForm } from "@/components/decision-form";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { actorCanDecide } from "@/lib/approval";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { creatives, getCampaign, getSettings, participants, streamerByOwner } from "@/lib/store";

export default async function StreamerCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id);
  const campaign = await getCampaign((await params).id);
  if (!streamer || !campaign) notFound();
  const [lines, assets, settings] = await Promise.all([participants(campaign.id), creatives(campaign.id), getSettings()]);
  const line = lines.find((item) => item.streamerId === streamer.id);
  if (!line) notFound();
  const canDecide = campaign.status === "pending_approval" && actorCanDecide(line.approvalMode, "streamer");
  return (
    <div>
      <PageHeader eyebrow={campaign.companyName ?? "Campaign"} title={campaign.name} description={campaign.brief || "No brief."} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge status={campaign.status} />
        <Badge status={line.status} />
      </div>
      <Panel className="space-y-2 p-5 text-sm leading-6 text-muted">
        <p>
          {campaign.startDate} → {campaign.endDate} · {campaign.placementDurationSec}s · {campaign.rotation} rotation · {campaign.placementSize}
        </p>
        <p>Destination {campaign.destinationUrl || "not set"}.</p>
        <p>Your line {money(line.rateCents, settings.currency)}. Restricted category: {campaign.restrictedTag || "none"}.</p>
        {line.note ? <p>Note: {line.note}</p> : null}
      </Panel>
      <ul className="mt-4 space-y-2 text-sm">
        {assets.map((asset) => (
          <li key={asset.id} className="flex items-center gap-2">
            <Badge status={asset.status} /> {asset.originalName}
          </li>
        ))}
      </ul>
      {canDecide ? (
        <div className="mt-6 max-w-lg">
          <DecisionForm campaignId={campaign.id} streamerId={streamer.id} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">
          {actorCanDecide(line.approvalMode, "streamer")
            ? "This campaign is not waiting on your decision."
            : "Your agency decides this placement."}
        </p>
      )}
    </div>
  );
}
