import Link from "next/link";
import { inviteCreator } from "@/actions/agency";
import { Form, SubmitButton } from "@/components/form";
import { Badge, Field, Input, PageHeader, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { earningTotals } from "@/lib/reports";
import { agencyByOwner, getSettings, listCampaignsForAgency, listInvites, roster } from "@/lib/store";

export default async function AgencyHome() {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  if (!agency) return null;
  const [people, campaigns, invites, settings] = await Promise.all([
    roster(agency.id),
    listCampaignsForAgency(agency.id),
    listInvites(agency.id),
    getSettings(),
  ]);
  const totals = await earningTotals(people.map((person) => person.id));
  return (
    <div>
      <PageHeader eyebrow="Agency" title={agency.name} description="Invite creators, set their commercial rules, and decide the flights your approval mode covers." />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Roster" value={String(people.length)} />
        <Stat label="Held" value={money(totals.held, settings.currency)} detail="Combined creator earnings still inside a flight." />
        <Stat label="Eligible" value={money(totals.eligible, settings.currency)} />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-2xl">Open campaigns</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {campaigns.slice(0, 8).map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between gap-3">
                <Link href={`/agency/campaigns/${campaign.id}`}>{campaign.name}</Link>
                <Badge status={campaign.status} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Invite a creator</h2>
          <Form action={inviteCreator} className="mt-3 space-y-3">
            <Field label="Email" hint="The code is shown after you send it. The creator enters it on their channel page.">
              <Input name="email" type="email" required />
            </Field>
            <SubmitButton>Create invite</SubmitButton>
          </Form>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {invites.map((invite) => (
              <li key={invite.code}>
                <span className="font-mono text-ink">{invite.code}</span> · {invite.email} · {invite.accepted_at ? "accepted" : "open"}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
