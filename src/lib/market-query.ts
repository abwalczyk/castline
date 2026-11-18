import { CONTENT_CATEGORIES } from "@/lib/constants";
import { cleanSearch, oneOf, parseDollarsToCents, parseInteger } from "@/lib/validate";

export function marketQuery(search: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const value = search[key];
    return typeof value === "string" ? value : "";
  };
  const price = one("price").trim();
  return {
    search: cleanSearch(one("q")),
    category: oneOf(one("category"), CONTENT_CATEGORIES) ?? "",
    minCcv: parseInteger(one("ccv"), 0, 10_000_000) ?? 0,
    minFollowers: parseInteger(one("followers"), 0, 100_000_000) ?? 0,
    maxPriceCents: price ? parseDollarsToCents(price) : null,
    q: one("q"),
    ccv: one("ccv"),
    followers: one("followers"),
    price,
  };
}
