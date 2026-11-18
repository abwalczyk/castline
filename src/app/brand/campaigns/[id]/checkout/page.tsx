import Link from "next/link";
import { notFound } from "next/navigation";
import { checkoutAction } from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { QuoteLines } from "@/components/quote";
import { Notice, PageHeader, Panel } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { simulatePaymentsAllowed } from "@/lib/payments";
import { brandByOwner, getCampaign, getSettings, participants } from "@/lib/store";

export default async function CheckoutPage({
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
  const [lines, settings] = await Promise.all([participants(campaign.id), getSettings()]);
  const total = lines.reduce((sum, line) => sum + line.rateCents, 0);
  const payable = campaign.status === "approved" || campaign.status === "payment_pending";
  return (
    <div>
      <PageHeader
        eyebrow="Checkout"
        title={campaign.name}
        description="The brand total is the sum of charged creator lines. Commission is already described inside each line and is not added again."
        action={
          <Link href={`/brand/campaigns/${campaign.id}`} className="text-sm text-muted">
            Back
          </Link>
        }
      />
      {query.cancelled === "1" ? <Notice>Checkout was cancelled. The campaign is still waiting for payment.</Notice> : null}
      {!payable ? <Notice>This campaign is not ready to pay. It needs creator approval, platform approval, and an approved creative.</Notice> : null}
      <div className="mt-6 grid gap-4">
        {lines.map((line) => (
          <Panel key={line.streamerId} className="grid gap-4 p-4 md:grid-cols-[1fr_280px]">
            <div>
              <p className="font-serif text-2xl">{line.displayName}</p>
              <p className="text-sm text-muted">{line.avgCcv.toLocaleString("en-US")} average CCV</p>
            </div>
            <QuoteLines
              quote={line.snapshot}
              rateCents={line.rateCents}
              overrideCents={line.overrideCents}
              commissionBps={settings.commissionBps}
              currency={settings.currency}
            />
          </Panel>
        ))}
      </div>
      <p className="mt-6 font-serif text-4xl tabular-nums">{money(total, settings.currency)}</p>
      {payable ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Form action={checkoutAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <input type="hidden" name="mode" value="stripe" />
            <SubmitButton>Pay with Stripe</SubmitButton>
          </Form>
          {simulatePaymentsAllowed() ? (
            <Form action={checkoutAction}>
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="mode" value="simulate" />
              <SubmitButton variant="secondary">Record a simulated payment</SubmitButton>
            </Form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
