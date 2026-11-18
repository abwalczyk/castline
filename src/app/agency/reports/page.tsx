import { PlaybackReport } from "@/components/playback";
import { PageHeader, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { earningTotals, streamerPlayback } from "@/lib/reports";
import { agencyByOwner, getSettings, roster } from "@/lib/store";

export default async function AgencyReportsPage() {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  if (!agency) return null;
  const people = await roster(agency.id);
  const [totals, settings] = await Promise.all([earningTotals(people.map((person) => person.id)), getSettings()]);
  const rows = (await Promise.all(people.map((person) => streamerPlayback(person.id)))).flat();
  return (
    <div>
      <PageHeader eyebrow="Reports" title="Roster delivery" description="Playback is counted per browser source. Estimated exposure uses each creator's stated average CCV." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Stat label="Held" value={money(totals.held, settings.currency)} />
        <Stat label="Eligible" value={money(totals.eligible, settings.currency)} />
        <Stat label="Paid" value={money(totals.paid, settings.currency)} />
      </div>
      <PlaybackReport rows={rows} />
    </div>
  );
}
