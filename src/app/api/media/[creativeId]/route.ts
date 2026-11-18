import { getCurrentUser } from "@/lib/auth";
import { mediaResponse } from "@/lib/media-response";
import { canReadCreative } from "@/lib/operations";
import { getObject } from "@/lib/storage";

export async function GET(request: Request, context: { params: Promise<{ creativeId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const creative = await canReadCreative(user, (await context.params).creativeId);
  if (!creative) return new Response("Not found", { status: 404 });
  const bytes = await getObject(creative.storageKey);
  if (!bytes) return new Response("Not found", { status: 404 });
  return mediaResponse(bytes, creative.mime, request);
}
