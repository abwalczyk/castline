import { commissionOn, type Quote } from "@/lib/pricing";
import { money, millisLabel } from "@/lib/format";

export function QuoteLines({
  quote,
  rateCents,
  overrideCents,
  commissionBps,
  currency,
}: {
  quote: Quote | null;
  rateCents: number;
  overrideCents: number | null;
  commissionBps: number;
  currency: string;
}) {
  if (!quote) {
    return <p className="text-sm leading-6 text-muted">Set a flight inside this creator&apos;s minimum and maximum days to see a price.</p>;
  }
  const commission = commissionOn(rateCents, commissionBps);
  const rows = [
    ["Tier", quote.tierName],
    ["Base daily rate", money(quote.baseDailyCents, currency)],
    ["Flight", `${quote.days} days`],
    ["Placement size", `× ${millisLabel(quote.sizeMillis)}`],
    ["Rotation", `× ${millisLabel(quote.rotationMillis)}`],
    ["Category exclusivity", `× ${millisLabel(quote.exclusivityMillis)}`],
    ["Calculated", money(quote.grossCents, currency)],
    ...(overrideCents != null ? [["Negotiated", money(rateCents, currency)]] : []),
    ["Charged to the brand", money(rateCents, currency)],
    ["Platform commission", `${money(commission, currency)} from the creator`],
    ["Creator net", money(rateCents - commission, currency)],
  ];
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right tabular-nums text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
