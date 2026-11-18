export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function millisLabel(millis: number) {
  return trimNumber(millis / 1000);
}

export function bpsLabel(bps: number) {
  return trimNumber(bps / 100);
}

export function durationLabel(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function trimNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
