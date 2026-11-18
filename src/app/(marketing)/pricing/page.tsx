import type { Metadata } from "next";
import { PriceExplorer } from "@/components/price-explorer";
import { tdClass, thClass } from "@/components/ui";
import { compact, money } from "@/lib/format";
import { getSettings, listTiers } from "@/lib/store";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [tiers, settings] = await Promise.all([listTiers(), getSettings()]);
  const currency = settings.currency.toUpperCase();
  return (
    <article className="py-14">
      <p className="text-xs uppercase tracking-[0.16em] text-faint">Rate card</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">Pricing is configured, not compiled in.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        A creator&apos;s daily rate is their asking price when they set one, otherwise the tier for their average concurrent viewers. An agency floor can only raise that base. Placement size, rotation, and category exclusivity are multipliers. Each one is rounded to the nearest cent before the next is applied. Platform commission is {settings.commissionBps / 100}% and comes out of the creator&apos;s side.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr>
              {["Tier", "Average CCV", "Daily rate", "Status"].map((heading) => (
                <th key={heading} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id}>
                <td className={tdClass}>{tier.name}</td>
                <td className={tdClass}>
                  {compact(tier.minCcv)}–{tier.maxCcv == null ? "and above" : compact(tier.maxCcv)}
                </td>
                <td className={tdClass}>{money(tier.dailyRateCents, currency)}</td>
                <td className={tdClass}>{tier.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10">
        <PriceExplorer
          tiers={tiers.map((tier) => ({
            name: tier.name,
            minCcv: tier.minCcv,
            maxCcv: tier.maxCcv,
            dailyRateCents: tier.dailyRateCents,
            active: tier.active,
          }))}
          settings={settings}
        />
      </div>
    </article>
  );
}
