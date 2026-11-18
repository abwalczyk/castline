import { recordPlayback } from "@/lib/overlay";
import { parseUuid } from "@/lib/validate";

export async function POST(request: Request, context: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await context.params;
  if (slug.length > 80 || token.length > 200) return new Response(null, { status: 404 });
  const text = await request.text();
  if (text.length > 2000) return new Response(null, { status: 400 });
  let body: { creativeId?: unknown; campaignId?: unknown; eventType?: unknown; durationMs?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return new Response(null, { status: 400 });
  }
  const creativeId = parseUuid(typeof body.creativeId === "string" ? body.creativeId : "");
  const campaignId = parseUuid(typeof body.campaignId === "string" ? body.campaignId : "");
  const eventType = body.eventType === "started" || body.eventType === "completed" ? body.eventType : null;
  const durationMs = typeof body.durationMs === "number" && Number.isFinite(body.durationMs) ? Math.round(body.durationMs) : 0;
  if (!creativeId || !campaignId || !eventType || durationMs < 0 || durationMs > 120_000) {
    return new Response(null, { status: 400 });
  }
  const status = await recordPlayback(slug, token, { creativeId, campaignId, eventType, durationMs });
  return new Response(null, { status });
}
