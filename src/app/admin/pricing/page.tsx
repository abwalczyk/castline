import { removeTierAction, saveSettingsAction, saveTierAction } from "@/actions/admin";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Panel } from "@/components/ui";
import { getSettings, listTiers } from "@/lib/store";

function multiplier(millis: number) {
  return (millis / 1000).toString();
}

export default async function PricingAdminPage() {
  const [settings, tiers] = await Promise.all([getSettings(), listTiers()]);
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Pricing" title="Tiers and commission" description="Changes apply to the next quote. A saved campaign keeps the price already stored on each creator line until it is repriced." />
      <Form action={saveSettingsAction} className="grid max-w-3xl gap-4 md:grid-cols-2">
        <Field label="Commission percent" hint="Deducted from the creator. 20 means 20%.">
          <Input name="commission" defaultValue={(settings.commissionBps / 100).toString()} />
        </Field>
        <Field label="Playbacks required to release earnings">
          <Input name="minPlaybacks" defaultValue={settings.minPlaybacksToRelease} />
        </Field>
        <Field label="Exclusivity multiplier">
          <Input name="exclusivity" defaultValue={multiplier(settings.exclusivityMillis)} />
        </Field>
        <Field label="Standard rotation">
          <Input name="rotationStandard" defaultValue={multiplier(settings.rotationStandardMillis)} />
        </Field>
        <Field label="High rotation">
          <Input name="rotationHigh" defaultValue={multiplier(settings.rotationHighMillis)} />
        </Field>
        <Field label="Max rotation">
          <Input name="rotationMax" defaultValue={multiplier(settings.rotationMaxMillis)} />
        </Field>
        <Field label="Small size">
          <Input name="sizeSmall" defaultValue={multiplier(settings.sizeSmallMillis)} />
        </Field>
        <Field label="Medium size">
          <Input name="sizeMedium" defaultValue={multiplier(settings.sizeMediumMillis)} />
        </Field>
        <Field label="Large size">
          <Input name="sizeLarge" defaultValue={multiplier(settings.sizeLargeMillis)} />
        </Field>
        <Field label="Image limit MB">
          <Input name="imageMb" defaultValue={(settings.maxImageBytes / 1024 / 1024).toString()} />
        </Field>
        <Field label="GIF limit MB">
          <Input name="gifMb" defaultValue={(settings.maxGifBytes / 1024 / 1024).toString()} />
        </Field>
        <Field label="Video limit MB">
          <Input name="videoMb" defaultValue={(settings.maxVideoBytes / 1024 / 1024).toString()} />
        </Field>
        <Field label="Video duration seconds">
          <Input name="videoSeconds" defaultValue={settings.maxVideoSeconds} />
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="requireBrandApproval" defaultChecked={settings.requireBrandApproval} />
          New advertiser profiles start pending
        </label>
        <div className="md:col-span-2">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </Form>
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Tiers</h2>
        {tiers.map((tier) => (
          <Panel key={tier.id} className="p-4">
            <Form action={saveTierAction} className="grid gap-3 md:grid-cols-5">
              <input type="hidden" name="id" value={tier.id} />
              <Input name="name" defaultValue={tier.name} />
              <Input name="minCcv" defaultValue={tier.minCcv} />
              <Input name="maxCcv" defaultValue={tier.maxCcv ?? ""} placeholder="No max" />
              <Input name="daily" defaultValue={(tier.dailyRateCents / 100).toFixed(2)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={tier.active} />
                Active
              </label>
              <SubmitButton variant="secondary">Update tier</SubmitButton>
            </Form>
            <Form action={removeTierAction} className="mt-2">
              <input type="hidden" name="id" value={tier.id} />
              <SubmitButton variant="ghost">Remove</SubmitButton>
            </Form>
          </Panel>
        ))}
        <Panel className="p-4">
          <h3 className="mb-3 text-sm text-muted">New tier</h3>
          <Form action={saveTierAction} className="grid gap-3 md:grid-cols-5">
            <Input name="name" placeholder="Name" />
            <Input name="minCcv" placeholder="Min CCV" />
            <Input name="maxCcv" placeholder="Max CCV" />
            <Input name="daily" placeholder="Daily $" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
            <SubmitButton>Add tier</SubmitButton>
          </Form>
        </Panel>
      </section>
    </div>
  );
}
