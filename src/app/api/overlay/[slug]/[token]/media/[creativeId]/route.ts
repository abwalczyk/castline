import { mediaResponse } from "@/lib/media-response";
import { mediaForToken } from "@/lib/overlay";

export async function GET(request: Request, context: { params: Promise<{ slug: string; token: string; creativeId: string }> }) {
  const { slug, token, creativeId } = await context.params;
  if (slug.length > 80 || token.length > 200) return new Response("Not found", { status: 404 });
  const media = await mediaForToken(slug, token, creativeId);
  if (!media) return new Response("Not found", { status: 404 });
  return mediaResponse(media.bytes, media.mime, request);
}
