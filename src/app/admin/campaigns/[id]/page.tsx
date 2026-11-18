import { notFound } from "next/navigation";
import { forcePlacementAction, moderateCreativeAction, overridePriceAction, reviewCampaignAction } from "@/actions/admin";
import { Form, SubmitButton } from "@/components/form";
import { PlaybackReport } from "@/components/playback";
import { QuoteLines } from "@/components/quote";
import { Badge, Field, Input, PageHeader, Panel, Select, Textarea } from "@/components/ui";
import { money } from "@/lib/format";
import { campaignPlayback } from "@/lib/reports";
import { creatives, getCampaign, getSettings, participants } from "@/lib/store";

export default async function AdminCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const campaign = await getCampaign((await params).id);
  if (!campaign) notFound();
  const [lines, assets, settings, playback] = await Promise.all([
    participants(campaign.id),
    creatives(campaign.id),
    getSettings(),
    campaignPlayback(campaign.id),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={campaign.companyName ?? "Campaign"} title={campaign.name} description={campaign.brief || "No brief."} />
      <div className="flex flex-wrap gap-2">
        <Badge status={campaign.status} />
        <Badge status={campaign.adminReview} />
      </div>
      <p className="text-sm text-muted">
        {campaign.startDate} → {campaign.endDate} · budget {money(campaign.budgetCents, settings.currency)} · {campaign.destinationUrl || "no destination"}
      </p>
      <Panel className="p-5">
        <h2 className="font-serif text-2xl">Platform review</h2>
        <Form action={reviewCampaignAction} className="mt-4 max-w-xl space-y-3">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <Select name="review" defaultValue="approved">
            <option value="approved">Approve</option>
            <option value="changes_requested">Request changes</option>
            <option value="rejected">Reject</option>
          </Select>
          <Textarea name="note" defaultValue={campaign.adminNote} placeholder="Required unless you approve." />
          <SubmitButton>Save review</SubmitButton>
        </Form>
      </Panel>
      {lines.map((line) => (
        <Panel key={line.streamerId} className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl">{line.displayName}</h2>
            <div className="mt-2 flex gap-2">
              <Badge status={line.status} />
            </div>
            <p className="mt-2 text-sm text-muted">
              Creator {line.streamerDecision ?? "pending"} · agency {line.managerDecision ?? "pending"} · {line.approvalMode}
            </p>
            <Form action={forcePlacementAction} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="streamerId" value={line.streamerId} />
              <Select name="decision" defaultValue="approved">
                <option value="approved">Force approve</option>
                <option value="changes_requested">Force changes</option>
                <option value="rejected">Force reject</option>
              </Select>
              <SubmitButton variant="secondary">Override decision</SubmitButton>
            </Form>
          </div>
          <div>
            <QuoteLines
              quote={line.snapshot}
              rateCents={line.rateCents}
              overrideCents={line.overrideCents}
              commissionBps={settings.commissionBps}
              currency={settings.currency}
            />
            <Form action={overridePriceAction} className="mt-4 space-y-2">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="streamerId" value={line.streamerId} />
              <Field label="Negotiated total" hint="Blank clears the override and charges the calculated price.">
                <Input name="rate" defaultValue={line.overrideCents != null ? (line.overrideCents / 100).toFixed(2) : ""} />
              </Field>
              <SubmitButton variant="secondary">Save price</SubmitButton>
            </Form>
          </div>
        </Panel>
      ))}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Creatives</h2>
        {assets.map((asset) => (
          <Panel key={asset.id} className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
            {asset.type === "mp4" ? (
              <video src={`/api/media/${asset.id}`} className="aspect-video w-full bg-black" muted controls />
            ) : (
              // Moderators review the uploaded file itself.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${asset.id}`} alt="" className="aspect-video w-full bg-black object-contain" />
            )}
            <Form action={moderateCreativeAction} className="space-y-3">
              <input type="hidden" name="creativeId" value={asset.id} />
              <p className="text-sm">
                {asset.originalName} <Badge status={asset.status} />
              </p>
              <Select name="status" defaultValue="approved">
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </Select>
              <Textarea name="note" defaultValue={asset.moderationNote} placeholder="Required when rejecting." />
              <SubmitButton variant="secondary">Moderate</SubmitButton>
            </Form>
          </Panel>
        ))}
      </section>
      <PlaybackReport rows={playback} />
    </div>
  );
}
