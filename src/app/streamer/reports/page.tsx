import { PlaybackReport } from "@/components/playback";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { streamerPlayback } from "@/lib/reports";
import { streamerByOwner } from "@/lib/store";

export default async function StreamerReportsPage() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id);
  if (!streamer) return null;
  const rows = await streamerPlayback(streamer.id);
  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Playback, not impressions"
        description="Completed plays come from your browser source. Estimated viewer-hours multiply your stated average CCV by that airtime."
      />
      <PlaybackReport rows={rows} />
    </div>
  );
}
