import Link from "next/link";
import { Badge, PageHeader, Stat, tdClass, thClass } from "@/components/ui";
import { money } from "@/lib/format";
import { deliveryMonitor, monthlyRevenue, platformTotals } from "@/lib/reports";
import { getSettings } from "@/lib/store";

export default async function AdminHome() {
  const [totals, months, delivery, settings] = await Promise.all([
    platformTotals(),
    monthlyRevenue(),
    deliveryMonitor(),
    getSettings(),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Platform" description="Review, pricing, and payouts. Playback on a live source is not treated as verified audience." />
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Gross paid" value={money(totals.paidCents, settings.currency)} />
        <Stat label="Commission" value={money(totals.commissionCents, settings.currency)} detail="Taken from creator lines." />
        <Stat label="Refunded" value={money(totals.refundedCents, settings.currency)} />
        <Stat label="Live or scheduled" value={String(totals.delivering)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Stat label="Campaigns waiting" value={String(totals.pendingCampaigns)} />
        <Stat label="Creatives waiting" value={String(totals.pendingCreatives)} />
        <Stat label="Open disputes" value={String(totals.openDisputes)} detail={`${totals.pendingVerifications} channels awaiting verification.`} />
      </div>
      <h2 className="mt-8 font-serif text-2xl">Monthly revenue</h2>
      <table className="mt-3 w-full">
        <thead>
          <tr>
            {["Month", "Paid", "Commission"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.month}>
              <td className={tdClass}>{month.month}</td>
              <td className={tdClass}>{money(month.paidCents, settings.currency)}</td>
              <td className={tdClass}>{money(month.commissionCents, settings.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-8 font-serif text-2xl">Delivery</h2>
      <table className="mt-3 w-full min-w-[640px]">
        <thead>
          <tr>
            {["Campaign", "Creator", "Status", "Completed playbacks", "Last playback"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {delivery.map((row) => (
            <tr key={`${row.campaignId}-${row.slug}`}>
              <td className={tdClass}>
                <Link href={`/admin/campaigns/${row.campaignId}`}>{row.campaignName}</Link>
              </td>
              <td className={tdClass}>{row.streamerName}</td>
              <td className={tdClass}>
                <Badge status={row.status} />
              </td>
              <td className={tdClass}>{row.playbacks}</td>
              <td className={tdClass}>{row.lastPlayback ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
