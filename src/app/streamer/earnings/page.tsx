import { savePayoutAccountAction } from "@/actions/streamer";
import { Form, SubmitButton } from "@/components/form";
import { Badge, Field, Input, PageHeader, Stat, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { earningTotals } from "@/lib/reports";
import { earningsForStreamer, getSettings, payoutsForStreamer, streamerByOwner } from "@/lib/store";

export default async function EarningsPage() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id, true);
  if (!streamer) return null;
  const [earnings, payouts, totals, settings] = await Promise.all([
    earningsForStreamer(streamer.id),
    payoutsForStreamer(streamer.id),
    earningTotals([streamer.id]),
    getSettings(),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Earnings"
        title="Held until the flight delivers"
        description={`A held balance becomes eligible after the campaign is completed and at least ${settings.minPlaybacksToRelease} completed playbacks are recorded for you. Payouts are released by the platform.`}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Held" value={money(totals.held, settings.currency)} />
        <Stat label="Eligible" value={money(totals.eligible, settings.currency)} />
        <Stat label="Paid" value={money(totals.paid, settings.currency)} />
      </div>
      <h2 className="mt-8 font-serif text-2xl">Ledger</h2>
      <table className="mt-3 w-full min-w-[640px]">
        <thead>
          <tr>
            {["Campaign", "Gross", "Commission", "Net", "Status"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning) => (
            <tr key={earning.id}>
              <td className={tdClass}>{earning.campaignName}</td>
              <td className={tdClass}>{money(earning.grossCents, settings.currency)}</td>
              <td className={tdClass}>{money(earning.commissionCents, settings.currency)}</td>
              <td className={tdClass}>{money(earning.netCents, settings.currency)}</td>
              <td className={tdClass}>
                <Badge status={earning.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-8 font-serif text-2xl">Payouts</h2>
      <table className="mt-3 w-full">
        <thead>
          <tr>
            {["Amount", "Method", "Status", "Note"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout.id}>
              <td className={tdClass}>{money(payout.amountCents, settings.currency)}</td>
              <td className={tdClass}>{payout.method}</td>
              <td className={tdClass}>
                <Badge status={payout.status} />
              </td>
              <td className={tdClass}>{payout.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Form action={savePayoutAccountAction} className="mt-8 max-w-md space-y-3">
        <Field label="Stripe Connect account" hint="Optional. Used only when the platform turns on Connect transfers. Format acct_…">
          <Input name="accountId" defaultValue={streamer.stripeAccountId ?? ""} placeholder="acct_" />
        </Field>
        <SubmitButton variant="secondary">Save payout account</SubmitButton>
      </Form>
    </div>
  );
}
