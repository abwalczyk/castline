import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteCreativeAction,
  openDisputeAction,
  saveDetails,
  saveRosterAction,
  submitCampaignAction,
  uploadCreative,
  withdrawCampaignAction,
} from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { PlaybackReport } from "@/components/playback";
import { QuoteLines } from "@/components/quote";
import { Badge, buttonClass, Field, Input, Notice, PageHeader, Panel, Select, Textarea } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import {
  BRAND_VERTICALS,
  DURATIONS,
  PLACEMENT_SIZES,
  RESTRICTED_TAGS,
  ROTATIONS,
} from "@/lib/constants";
import { money } from "@/lib/format";
import { campaignPlayback } from "@/lib/reports";
import {
  brandByOwner,
  creatives,
  disputesForCampaign,
  getCampaign,
  getSettings,
  listMarketplace,
  participants,
  streamerById,
} from "@/lib/store";

const EDITABLE = new Set(["draft", "changes_requested", "rejected"]);
const WITHDRAW = new Set(["pending_approval", "changes_requested", "approved", "payment_pending", "rejected"]);
const DISPUTE = new Set(["scheduled", "active", "completed"]);

export default async function CampaignEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireRole("brand");
  const brand = await brandByOwner(user.id);
  const campaign = await getCampaign(id);
  if (!brand || !campaign || campaign.brandId !== brand.id) notFound();
  const [lines, assets, settings, market, playback, disputes] = await Promise.all([
    participants(campaign.id),
    creatives(campaign.id),
    getSettings(),
    listMarketplace({ category: "", minCcv: 0, maxCcv: 0, minFollowers: 0, search: "", listedOnly: true }),
    campaignPlayback(campaign.id),
    disputesForCampaign(campaign.id),
  ]);
  const roster = new Map(market.map((streamer) => [streamer.id, streamer]));
  for (const line of lines) {
    if (!roster.has(line.streamerId)) {
      const streamer = await streamerById(line.streamerId);
      if (streamer) roster.set(streamer.id, streamer);
    }
  }
  const editable = EDITABLE.has(campaign.status);
  const total = lines.reduce((sum, line) => sum + line.rateCents, 0);
  const currency = settings.currency;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaign"
        title={campaign.name}
        description={`${campaign.startDate ?? "No start"} → ${campaign.endDate ?? "no end"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge status={campaign.status} />
            <Link href={`/brand/campaigns/${campaign.id}/preview`} className={buttonClass("secondary")}>
              Preview
            </Link>
            {campaign.status === "approved" || campaign.status === "payment_pending" ? (
              <Link href={`/brand/campaigns/${campaign.id}/checkout`} className={buttonClass()}>
                Checkout
              </Link>
            ) : null}
          </div>
        }
      />
      {query.paid === "1" ? (
        <Notice>
          {campaign.status === "active" || campaign.status === "scheduled"
            ? "Payment is confirmed. The flight follows the dates you set."
            : "Stripe returned you here. The flight moves to scheduled or active after the webhook confirms the charge."}
        </Notice>
      ) : null}
      {campaign.adminNote ? <Notice>Platform note: {campaign.adminNote}</Notice> : null}

      <Panel className="p-5">
        <h2 className="font-serif text-2xl">Flight</h2>
        {editable ? (
          <Form action={saveDetails} className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <Field label="Name">
              <Input name="name" defaultValue={campaign.name} required />
            </Field>
            <Field label="Vertical">
              <Select name="vertical" defaultValue={campaign.vertical}>
                {BRAND_VERTICALS.map((vertical) => (
                  <option key={vertical}>{vertical}</option>
                ))}
              </Select>
            </Field>
            <Field label="Destination URL" hint="Public HTTPS. Shown as a hostname on the broadcast.">
              <Input name="destinationUrl" defaultValue={campaign.destinationUrl} placeholder="https://" />
            </Field>
            <Field label="Restricted category" hint="Leave blank for a general placement.">
              <Select name="restrictedTag" defaultValue={campaign.restrictedTag}>
                <option value="">None</option>
                {RESTRICTED_TAGS.map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </Select>
            </Field>
            <Field label="Start">
              <Input name="startDate" type="date" defaultValue={campaign.startDate ?? ""} />
            </Field>
            <Field label="End">
              <Input name="endDate" type="date" defaultValue={campaign.endDate ?? ""} />
            </Field>
            <Field label="Budget" hint="Must cover the charged total before you submit.">
              <Input name="budget" defaultValue={campaign.budgetCents ? (campaign.budgetCents / 100).toFixed(2) : ""} />
            </Field>
            <Field label="Placement duration">
              <Select name="duration" defaultValue={String(campaign.placementDurationSec)}>
                {DURATIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} seconds
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Rotation" hint="Higher rotation costs more and appears more often in the playlist.">
              <Select name="rotation" defaultValue={campaign.rotation}>
                {ROTATIONS.map((rotation) => (
                  <option key={rotation}>{rotation}</option>
                ))}
              </Select>
            </Field>
            <Field label="Placement size">
              <Select name="size" defaultValue={campaign.placementSize}>
                {PLACEMENT_SIZES.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="exclusivity" defaultChecked={campaign.exclusivity} />
              Category exclusivity on this flight
            </label>
            <Field label="Brief" hint="Shown to the creator and the moderator.">
              <Textarea name="brief" defaultValue={campaign.brief} className="md:col-span-2" />
            </Field>
            <div className="md:col-span-2">
              <SubmitButton>Save and reprice</SubmitButton>
            </div>
          </Form>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">
            {campaign.brief || "No brief."} Destination {campaign.destinationUrl || "not set"}. Budget {money(campaign.budgetCents, currency)}. Charged total {money(total, currency)}.
          </p>
        )}
      </Panel>

      <Panel className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl">Roster</h2>
          <p className="text-sm tabular-nums text-muted">Charged {money(total, currency)}</p>
        </div>
        {editable ? (
          <Form action={saveRosterAction} className="mt-4 space-y-4">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <div className="divide-y divide-line rounded-md border border-line">
              {[...roster.values()].map((streamer) => {
                const line = lines.find((item) => item.streamerId === streamer.id);
                return (
                  <label key={streamer.id} className="grid gap-3 px-3 py-3 md:grid-cols-[1fr_280px]">
                    <span className="flex gap-3 text-sm">
                      <input type="checkbox" name="streamer" value={streamer.id} defaultChecked={Boolean(line)} />
                      <span>
                        <span className="block text-ink">{streamer.displayName}</span>
                        <span className="text-faint">{streamer.category} · {streamer.avgCcv.toLocaleString("en-US")} CCV</span>
                      </span>
                    </span>
                    {line ? (
                      <QuoteLines
                        quote={line.snapshot}
                        rateCents={line.rateCents}
                        overrideCents={line.overrideCents}
                        commissionBps={settings.commissionBps}
                        currency={currency}
                      />
                    ) : (
                      <span className="text-sm text-faint">Not on this flight</span>
                    )}
                  </label>
                );
              })}
            </div>
            <SubmitButton variant="secondary">Update roster</SubmitButton>
          </Form>
        ) : (
          <div className="mt-4 space-y-4">
            {lines.map((line) => (
              <div key={line.streamerId} className="grid gap-3 border-t border-line pt-3 md:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-ink">{line.displayName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge status={line.status} />
                    <span className="text-xs text-faint">Creator {line.streamerDecision ?? "pending"} · Agency {line.managerDecision ?? "pending"}</span>
                  </div>
                  {line.note ? <p className="mt-2 text-sm text-muted">{line.note}</p> : null}
                </div>
                <QuoteLines
                  quote={line.snapshot}
                  rateCents={line.rateCents}
                  overrideCents={line.overrideCents}
                  commissionBps={settings.commissionBps}
                  currency={currency}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-5">
        <h2 className="font-serif text-2xl">Creatives</h2>
        <ul className="mt-4 space-y-3">
          {assets.map((asset) => (
            <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-3">
                <Badge status={asset.status} />
                <span>{asset.originalName}</span>
                <span className="text-faint">{asset.type}</span>
              </span>
              {editable ? (
                <Form action={deleteCreativeAction}>
                  <input type="hidden" name="creativeId" value={asset.id} />
                  <SubmitButton variant="ghost">Remove</SubmitButton>
                </Form>
              ) : null}
            </li>
          ))}
        </ul>
        {editable ? (
          <Form action={uploadCreative} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <Field label="Upload" hint="PNG, JPEG, WebP, GIF, or MP4. SVG is not accepted.">
              <Input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4" required />
            </Field>
            <SubmitButton variant="secondary">Upload</SubmitButton>
          </Form>
        ) : (
          <p className="mt-3 text-sm text-muted">Creatives are locked while the campaign is in review or on air.</p>
        )}
      </Panel>

      <div className="flex flex-wrap gap-3">
        {editable ? (
          <Form action={submitCampaignAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <SubmitButton>Submit for approval</SubmitButton>
          </Form>
        ) : null}
        {WITHDRAW.has(campaign.status) ? (
          <Form action={withdrawCampaignAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <SubmitButton variant="secondary">Withdraw to draft</SubmitButton>
          </Form>
        ) : null}
      </div>

      {DISPUTE.has(campaign.status) ? (
        <Panel className="p-5">
          <h2 className="font-serif text-2xl">Dispute</h2>
          <p className="mt-2 text-sm text-muted">Open a dispute if delivery did not match the flight. Refunds are decided by an administrator.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {disputes.map((dispute) => (
              <li key={dispute.id}>
                <Badge status={dispute.status} /> {dispute.reason}
              </li>
            ))}
          </ul>
          <Form action={openDisputeAction} className="mt-4 max-w-xl space-y-3">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <Textarea name="reason" placeholder="Describe what should be reviewed. At least a sentence." />
            <SubmitButton variant="danger">Open dispute</SubmitButton>
          </Form>
        </Panel>
      ) : null}

      <section>
        <h2 className="mb-4 font-serif text-3xl">Delivery</h2>
        <PlaybackReport rows={playback} />
      </section>
    </div>
  );
}
