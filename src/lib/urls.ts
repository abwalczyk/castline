export function validateDestinationUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    return { ok: false, error: "Enter an HTTPS destination URL." };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid destination URL." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "Destination URLs cannot include embedded credentials." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Destination URLs must use HTTPS." };
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost") ||
    isPrivateIp(host)
  ) {
    return { ok: false, error: "Destination host must be a public HTTPS site." };
  }
  return { ok: true, url: url.toString() };
}

export function destinationHost(raw: string) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isPrivateIp(host: string) {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return host.includes(":") && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"));
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part > 255)) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}
