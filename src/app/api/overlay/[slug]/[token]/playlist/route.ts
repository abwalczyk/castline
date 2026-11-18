import { playlistForToken } from "@/lib/overlay";

export async function GET(_request: Request, context: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await context.params;
  if (slug.length > 80 || token.length > 200) return Response.json({ error: "Not found" }, { status: 404 });
  const playlist = await playlistForToken(slug, token);
  if (!playlist) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(
    { ads: playlist.ads, pollMs: 15000 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
