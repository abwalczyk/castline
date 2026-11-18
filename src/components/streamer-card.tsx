import Link from "next/link";
import { CONTENT_CATEGORIES } from "@/lib/constants";
import { buttonClass, Input, Select } from "@/components/ui";
import { money } from "@/lib/format";

export function StreamerFilters({
  values,
}: {
  values: { q: string; category: string; ccv: string; followers: string; price: string };
}) {
  return (
    <form method="get" className="grid gap-3 md:grid-cols-6">
      <Input name="q" defaultValue={values.q} placeholder="Search" className="md:col-span-2" />
      <Select name="category" defaultValue={values.category}>
        <option value="">All categories</option>
        {CONTENT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>
      <Select name="ccv" defaultValue={values.ccv}>
        <option value="">Any CCV</option>
        <option value="50">50+ CCV</option>
        <option value="200">200+ CCV</option>
        <option value="1000">1,000+ CCV</option>
        <option value="5000">5,000+ CCV</option>
      </Select>
      <Select name="followers" defaultValue={values.followers}>
        <option value="">Any audience</option>
        <option value="1000">1,000+ followers</option>
        <option value="10000">10,000+ followers</option>
        <option value="100000">100,000+ followers</option>
      </Select>
      <Select name="price" defaultValue={values.price}>
        <option value="">Any daily rate</option>
        <option value="100">Up to $100</option>
        <option value="250">Up to $250</option>
        <option value="500">Up to $500</option>
        <option value="1000">Up to $1,000</option>
      </Select>
      <button className={buttonClass("secondary")}>Filter</button>
    </form>
  );
}

export function rateLabel(dailyRateCents: number | null, tierDailyCents: number | null) {
  if (dailyRateCents != null) return `${money(dailyRateCents)} / day`;
  if (tierDailyCents != null) return `${money(tierDailyCents)} / day tier`;
  return "Rate on request";
}

export function StreamerCard({
  href,
  name,
  category,
  ccv,
  followers,
  rate,
}: {
  href: string;
  name: string;
  category: string;
  ccv: string;
  followers: string;
  rate: string;
}) {
  return (
    <Link href={href} className="block rounded-lg border border-line bg-surface p-4 hover:border-accent/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">{name}</h2>
          <p className="mt-1 text-sm text-muted">{category}</p>
        </div>
        <p className="text-sm tabular-nums text-accent-soft">{rate}</p>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-faint">
        {ccv} avg CCV · {followers} followers
      </p>
    </Link>
  );
}
