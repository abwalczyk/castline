import Link from "next/link";
import { closeDisputeAction, releasePayoutAction } from "@/actions/admin";
import { Form, SubmitButton } from "@/components/form";
import { Badge, Field, Input, PageHeader, Panel, Select, tdClass, Textarea, thClass } from "@/components/ui";
import { money } from "@/lib/format";
import { earningBalances } from "@/lib/reports";
import { getSettings, listDisputes, listPayments, listPayouts } from "@/lib/store";

export default async function FinancePage() {
  const [payments, payouts, disputes, balances, settings] = await Promise.all([
    listPayments(),
    listPayouts(),
    listDisputes(),
    earningBalances(),
    getSettings(),
  ]);
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Finance"
        title="Payments and payouts"
        description="Eligible earnings can be marked paid here. Stripe Connect sends a transfer only when STRIPE_CONNECT is on and the creator saved an acct_ id. Otherwise this is a manual payout record."
      />
      <section>
        <h2 className="font-serif text-2xl">Creator balances</h2>
        <table className="mt-3 w-full min-w-[640px]">
          <thead>
            <tr>
              {["Creator", "Held", "Eligible", "Paid", ""].map((heading) => (
                <th key={heading || "pay"} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {balances.map((row) => (
              <tr key={row.streamerId}>
                <td className={tdClass}>{row.streamerName}</td>
                <td className={tdClass}>{money(row.heldCents, settings.currency)}</td>
                <td className={tdClass}>{money(row.eligibleCents, settings.currency)}</td>
                <td className={tdClass}>{money(row.paidCents, settings.currency)}</td>
                <td className={tdClass}>
                  {row.eligibleCents > 0 ? (
                    <Form action={releasePayoutAction} className="flex gap-2">
                      <input type="hidden" name="streamerId" value={row.streamerId} />
                      <Input name="note" placeholder="Note" />
                      <SubmitButton>Pay eligible</SubmitButton>
                    </Form>
                  ) : (
                    <span className="text-xs text-faint">Nothing eligible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Payments</h2>
        <table className="mt-3 w-full min-w-[680px]">
          <thead>
            <tr>
              {["Campaign", "Amount", "Commission", "Refunded", "Status"].map((heading) => (
                <th key={heading} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className={tdClass}>
                  <Link href={`/admin/campaigns/${payment.campaignId}`}>{payment.campaignName}</Link>
                </td>
                <td className={tdClass}>{money(payment.amountCents, payment.currency)}</td>
                <td className={tdClass}>{money(payment.commissionCents, payment.currency)}</td>
                <td className={tdClass}>{money(payment.refundedCents, payment.currency)}</td>
                <td className={tdClass}>
                  <Badge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Payouts</h2>
        <table className="mt-3 w-full">
          <thead>
            <tr>
              {["Creator", "Amount", "Method", "Status"].map((heading) => (
                <th key={heading} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className={tdClass}>{payout.streamerName}</td>
                <td className={tdClass}>{money(payout.amountCents, settings.currency)}</td>
                <td className={tdClass}>{payout.method}</td>
                <td className={tdClass}>
                  <Badge status={payout.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Disputes</h2>
        {disputes.map((dispute) => (
          <Panel key={dispute.id} className="p-4">
            <p className="text-sm">
              <Link href={`/admin/campaigns/${dispute.campaignId}`}>{dispute.campaignName}</Link> · <Badge status={dispute.status} /> ·{" "}
              {money(dispute.amountCents, settings.currency)}
            </p>
            <p className="mt-2 text-sm text-muted">{dispute.reason}</p>
            {dispute.status === "open" ? (
              <Form action={closeDisputeAction} className="mt-3 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="disputeId" value={dispute.id} />
                <Select name="outcome" defaultValue="deny">
                  <option value="deny">Deny</option>
                  <option value="refund">Refund</option>
                </Select>
                <Field label="Refund amount">
                  <Input name="refund" placeholder="Required for a refund" />
                </Field>
                <Textarea name="note" className="md:col-span-2" placeholder="How this was resolved." />
                <SubmitButton variant="secondary">Close dispute</SubmitButton>
              </Form>
            ) : (
              <p className="mt-2 text-sm text-faint">{dispute.resolutionNote}</p>
            )}
          </Panel>
        ))}
      </section>
    </div>
  );
}
