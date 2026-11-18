"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import { PLACEMENT_SIZES, ROTATIONS, type PlacementSize, type Rotation } from "@/lib/constants";
import { money, millisLabel } from "@/lib/format";
import { quotePlacement, tierForCcv, type PricingSettings, type PricingTier } from "@/lib/pricing";
import { parseDollarsToCents } from "@/lib/validate";

export function PriceExplorer({ tiers, settings }: { tiers: PricingTier[]; settings: PricingSettings }) {
  const [ccv, setCcv] = useState(420);
  const [days, setDays] = useState(7);
  const [size, setSize] = useState<PlacementSize>("medium");
  const [rotation, setRotation] = useState<Rotation>("standard");
  const [exclusivity, setExclusivity] = useState(false);
  const [asking, setAsking] = useState("");
  const askingCents = asking.trim() ? parseDollarsToCents(asking) : null;
  const tier = tierForCcv(ccv, tiers);
  const quote =
    asking.trim() && askingCents == null
      ? null
      : quotePlacement({
          ccv,
          days,
          askingDailyCents: askingCents,
          floorDailyCents: null,
          size,
          rotation,
          exclusivity,
          tiers,
          settings,
        });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <label className="block text-sm">
          Average CCV
          <Input className="mt-1" inputMode="numeric" value={ccv} onChange={(event) => setCcv(Number(event.target.value) || 0)} />
        </label>
        <label className="block text-sm">
          Days
          <Input className="mt-1" inputMode="numeric" value={days} onChange={(event) => setDays(Number(event.target.value) || 1)} />
        </label>
        <label className="block text-sm">
          Asking daily rate
          <Input className="mt-1" placeholder="Blank uses the tier" value={asking} onChange={(event) => setAsking(event.target.value)} />
        </label>
        <label className="block text-sm">
          Size
          <Select className="mt-1" value={size} onChange={(event) => setSize(event.target.value as PlacementSize)}>
            {PLACEMENT_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm">
          Rotation
          <Select className="mt-1" value={rotation} onChange={(event) => setRotation(event.target.value as Rotation)}>
            {ROTATIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={exclusivity} onChange={(event) => setExclusivity(event.target.checked)} />
          Category exclusivity
        </label>
      </div>
      <div className="rounded-lg border border-line bg-surface-2 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-faint">Illustrative quote</p>
        <p className="mt-2 text-sm text-muted">Matched tier: {tier ? `${tier.name} · ${money(tier.dailyRateCents)} / day` : "none"}</p>
        {quote ? (
          <dl className="mt-4 space-y-2 text-sm">
            <Line label="Base daily" value={money(quote.baseDailyCents)} />
            <Line label="Size" value={`× ${millisLabel(quote.sizeMillis)}`} />
            <Line label="Rotation" value={`× ${millisLabel(quote.rotationMillis)}`} />
            <Line label="Exclusivity" value={`× ${millisLabel(quote.exclusivityMillis)}`} />
            <Line label="Brand total" value={money(quote.grossCents)} />
            <Line label="Creator net" value={money(quote.netCents)} />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted">Enter a whole number of days from 1 to 90 and a valid asking rate, or leave the rate blank.</p>
        )}
        <p className="mt-4 text-xs leading-5 text-faint">
          Commission is taken from the creator. It is shown here and is not added to the brand total. Checkout uses the creator&apos;s asking rate, any agency floor, and the flight you actually book. An administrator can replace a line with a negotiated price.
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
