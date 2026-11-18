import { durationLabel } from "@/lib/format";
import { Stat, tdClass, thClass } from "@/components/ui";

export type PlaybackRow = {
  streamerName: string;
  creativeName: string;
  campaignName?: string;
  playbacks: number;
  starts: number;
  durationMs: number;
  estimatedViewerHours: number;
};

export function PlaybackReport({ rows }: { rows: PlaybackRow[] }) {
  const playbacks = rows.reduce((sum, row) => sum + row.playbacks, 0);
  const duration = rows.reduce((sum, row) => sum + row.durationMs, 0);
  const hours = rows.reduce((sum, row) => sum + row.estimatedViewerHours, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Verified playbacks" value={playbacks.toLocaleString("en-US")} detail="Completed plays on the browser source. This is not verified viewer exposure." />
        <Stat label="Playback time" value={durationLabel(duration)} detail="Sum of completed playback durations reported by the source." />
        <Stat
          label="Estimated exposure"
          value={`${hours.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`}
          detail="Average CCV × completed playback hours. An estimate, not a measured audience."
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No playback has been recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                {["Creator", "Campaign", "Creative", "Starts", "Completed", "Duration", "Est. viewer-hours"].map((heading) => (
                  <th key={heading} className={thClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.streamerName}-${row.creativeName}-${row.campaignName ?? ""}`}>
                  <td className={tdClass}>{row.streamerName}</td>
                  <td className={tdClass}>{row.campaignName ?? "—"}</td>
                  <td className={tdClass}>{row.creativeName}</td>
                  <td className={tdClass}>{row.starts}</td>
                  <td className={tdClass}>{row.playbacks}</td>
                  <td className={tdClass}>{durationLabel(row.durationMs)}</td>
                  <td className={tdClass}>{row.estimatedViewerHours.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
