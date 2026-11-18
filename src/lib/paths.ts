import type { Role } from "@/lib/constants";

export function homeForRole(role: Role | string) {
  if (role === "brand") return "/brand";
  if (role === "streamer") return "/streamer";
  if (role === "manager") return "/agency";
  if (role === "admin") return "/admin";
  return "/";
}

export function safeNextPath(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\n")) {
    return fallback;
  }
  return value;
}

export function overlayPath(
  slug: string,
  token: string,
  options: { width: number; height: number; position: string; size: string; audio: boolean },
) {
  const params = new URLSearchParams({
    w: String(options.width),
    h: String(options.height),
    pos: options.position,
    size: options.size,
  });
  if (options.audio) params.set("audio", "1");
  return `/overlay/${slug}/${token}?${params.toString()}`;
}
