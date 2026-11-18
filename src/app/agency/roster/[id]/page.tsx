import { notFound } from "next/navigation";
import { saveRules } from "@/actions/agency";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { APPROVAL_MODES, RESTRICTED_TAGS } from "@/lib/constants";
import { labelize } from "@/lib/labels";
import { agencyByOwner, streamerById } from "@/lib/store";

export default async function RosterMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  const streamer = await streamerById((await params).id);
  if (!agency || !streamer || streamer.agencyId !== agency.id || streamer.linkStatus !== "active") notFound();
  return (
    <div>
      <PageHeader eyebrow="Roster" title={streamer.displayName} description="These rules apply on top of the creator's own rate. The floor can raise a quote. It cannot discount one." />
      <Form action={saveRules} className="max-w-xl space-y-4">
        <input type="hidden" name="streamerId" value={streamer.id} />
        <Field label="Minimum daily rate" hint="Blank clears the floor.">
          <Input name="minDaily" defaultValue={streamer.minDailyRateCents != null ? (streamer.minDailyRateCents / 100).toFixed(2) : ""} />
        </Field>
        <Field label="Approval requirement">
          <Select name="approvalMode" defaultValue={streamer.approvalMode}>
            {APPROVAL_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {labelize(mode)}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm">Additional blocked categories</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {RESTRICTED_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2">
                <input type="checkbox" name="blocked" value={tag} defaultChecked={streamer.blockedTags.includes(tag)} />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accepting" defaultChecked={streamer.acceptingAds} />
          Accept new campaigns
        </label>
        <SubmitButton>Save rules</SubmitButton>
      </Form>
    </div>
  );
}
