import { saveCommercial } from "@/actions/streamer";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { APPROVAL_MODES, PLACEMENT_SIZES, RESTRICTED_TAGS } from "@/lib/constants";
import { labelize } from "@/lib/labels";
import { streamerByOwner } from "@/lib/store";

export default async function CommercialPage() {
  const user = await requireRole("streamer");
  const streamer = await streamerByOwner(user.id);
  if (!streamer) return null;
  const managed = streamer.linkStatus === "active";
  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Rates and inventory"
        description="Leave the daily rate blank to use the platform tier for your average CCV. An agency floor can raise the price a brand is quoted."
      />
      <Form action={saveCommercial} className="max-w-xl space-y-4">
        <Field label="Asking daily rate" hint={streamer.minDailyRateCents != null ? `Agency floor $${(streamer.minDailyRateCents / 100).toFixed(2)}.` : "Blank uses the tier."}>
          <Input name="dailyRate" defaultValue={streamer.dailyRateCents != null ? (streamer.dailyRateCents / 100).toFixed(2) : ""} />
        </Field>
        <Field label="Default placement size">
          <Select name="size" defaultValue={streamer.placementSize}>
            {PLACEMENT_SIZES.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </Select>
        </Field>
        <Field label="Minimum days">
          <Input name="minDays" defaultValue={streamer.minDays} required />
        </Field>
        <Field label="Maximum days">
          <Input name="maxDays" defaultValue={streamer.maxDays} required />
        </Field>
        <Field label="Concurrent campaigns">
          <Input name="maxConcurrent" defaultValue={streamer.maxConcurrent} required />
        </Field>
        <Field label="Who approves" hint={managed ? "Your agency sets this while you are represented." : "Self means you decide. Both means you and an agency."}>
          {managed ? <input type="hidden" name="approvalMode" value={streamer.approvalMode} /> : null}
          <Select name={managed ? undefined : "approvalMode"} defaultValue={streamer.approvalMode} disabled={managed}>
            {APPROVAL_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {labelize(mode)}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm">Decline these categories</legend>
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
        <SubmitButton>Save rates</SubmitButton>
      </Form>
    </div>
  );
}
